import { getServerEnv } from "@/lib/env";
import type { createSupabaseServerClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

export async function getBetaAccess({
  supabase,
  userId,
  userEmail,
}: {
  supabase: SupabaseServerClient;
  userId: string;
  userEmail?: string | null;
}) {
  const env = getServerEnv();
  const enabled = Boolean(env.BETA_ACCESS_ENABLED);
  const adminEmails = new Set(
    (env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
  const isAdmin = Boolean(userEmail && adminEmails.has(userEmail.toLowerCase()));

  if (!enabled) return { enabled, allowed: true, isAdmin };
  if (isAdmin) return { enabled, allowed: true, isAdmin };

  const { data } = await supabase
    .from("beta_access_redemptions")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  return { enabled, allowed: Boolean(data?.id), isAdmin };
}

export async function requireBetaAccess({
  supabase,
  userId,
  userEmail,
}: {
  supabase: SupabaseServerClient;
  userId: string;
  userEmail?: string | null;
}) {
  const state = await getBetaAccess({ supabase, userId, userEmail });
  if (!state.enabled || state.allowed) return { ok: true as const, state };
  return { ok: false as const, state };
}

