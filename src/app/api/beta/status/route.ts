import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isBetaEnabled } from "@/lib/beta";

export async function GET() {
  if (!isBetaEnabled()) return NextResponse.json({ enabled: false, allowed: true });

  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ enabled: true, allowed: false });

  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("beta_access_redemptions")
    .select("id")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  return NextResponse.json({ enabled: true, allowed: Boolean(data?.id) });
}

