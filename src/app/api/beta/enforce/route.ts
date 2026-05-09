import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isBetaEnabled } from "@/lib/beta";

export async function GET() {
  if (!isBetaEnabled()) return NextResponse.json({ ok: true, allowed: true });

  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return new NextResponse("Unauthorized", { status: 401 });

  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("beta_access_redemptions")
    .select("id")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (!data?.id) return new NextResponse("Private beta access required.", { status: 403 });
  return NextResponse.json({ ok: true, allowed: true });
}

