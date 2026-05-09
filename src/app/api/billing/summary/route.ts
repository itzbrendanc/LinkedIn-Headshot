import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ balance: 0 });

  const { data: credits } = await supabase
    .from("user_credits")
    .select("balance,lifetime_purchased,lifetime_used")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  const { data: orders } = await supabase
    .from("orders")
    .select("id,plan_id,amount_cents,currency,status,created_at,credits_granted,credits_used,credits_refunded")
    .order("created_at", { ascending: false })
    .limit(20);

  return NextResponse.json({
    balance: (credits?.balance as number | null) ?? 0,
    lifetimePurchased: (credits?.lifetime_purchased as number | null) ?? 0,
    lifetimeUsed: (credits?.lifetime_used as number | null) ?? 0,
    orders: orders ?? [],
  });
}

