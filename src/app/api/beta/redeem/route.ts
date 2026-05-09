import { NextResponse } from "next/server";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getBetaCodes, isBetaEnabled } from "@/lib/beta";
import { logger } from "@/lib/logger";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  code: z.string().min(1).max(64),
});

export async function POST(request: Request) {
  if (!isBetaEnabled()) return NextResponse.json({ ok: true, gated: false });

  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return new NextResponse("Unauthorized", { status: 401 });

  const rl = rateLimit(`beta_redeem:${auth.user.id}`, { capacity: 10, refillPerSecond: 1 / 10 });
  if (!rl.allowed) return new NextResponse("Too many requests. Try again later.", { status: 429 });

  const { code } = schema.parse(await request.json());
  const normalized = code.trim();

  // Allow codes via admin table OR via env fallback list.
  const admin = createSupabaseAdminClient();
  const { data: codeRow } = await admin
    .from("beta_access_codes")
    .select("code,disabled,max_redemptions")
    .eq("code", normalized)
    .maybeSingle();

  const envAllowed = new Set(getBetaCodes()).has(normalized);
  if (!codeRow && !envAllowed) return new NextResponse("Invalid access code.", { status: 400 });
  if (codeRow?.disabled) return new NextResponse("This access code is disabled.", { status: 403 });

  if (codeRow?.max_redemptions) {
    const { count } = await admin
      .from("beta_access_redemptions")
      .select("id", { count: "exact", head: true })
      .eq("redeemed_code", normalized);
    if ((count ?? 0) >= codeRow.max_redemptions) {
      return new NextResponse("This access code has reached its redemption limit.", { status: 409 });
    }
  }

  // Idempotent for the user.
  const { data: existing } = await admin
    .from("beta_access_redemptions")
    .select("id,code")
    .eq("user_id", auth.user.id)
    .maybeSingle();
  if (existing?.id) return NextResponse.json({ ok: true, code: existing.code });

  // Prevent unlimited reuse: unique(code) ensures only one user can redeem a given code.
  const { error } = await admin.from("beta_access_redemptions").insert({
    user_id: auth.user.id,
    code: normalized,
    redeemed_code: normalized,
  });
  if (error) return new NextResponse("This access code has already been used.", { status: 409 });

  logger.info("beta_code_redeemed", { userId: auth.user.id });
  return NextResponse.json({ ok: true, code: normalized });
}
