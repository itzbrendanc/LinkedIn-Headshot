import { NextResponse } from "next/server";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/admin-auth";
import { logger } from "@/lib/logger";

const schema = z.object({
  userId: z.string().uuid(),
  amount: z.number().int().min(1).max(100000),
});

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return new NextResponse("Unauthorized", { status: 401 });
  if (!isAdminEmail(auth.user.email)) return new NextResponse("Forbidden", { status: 403 });

  const body = schema.parse(await request.json());
  const admin = createSupabaseAdminClient();

  const { data: credits } = await admin
    .from("user_credits")
    .select("balance,lifetime_purchased,lifetime_used")
    .eq("user_id", body.userId)
    .maybeSingle();

  if (!credits) {
    await admin.from("user_credits").insert({
      user_id: body.userId,
      balance: body.amount,
      lifetime_purchased: body.amount,
      lifetime_used: 0,
    });
  } else {
    await admin
      .from("user_credits")
      .update({
        balance: (credits.balance as number) + body.amount,
        lifetime_purchased: (credits.lifetime_purchased as number) + body.amount,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", body.userId);
  }

  await admin.from("credit_transactions").insert({
    user_id: body.userId,
    delta: body.amount,
    reason: `admin_grant:${auth.user.email}`,
  });

  logger.warn("admin_grant_credits", { adminEmail: auth.user.email, userId: body.userId, amount: body.amount });
  return NextResponse.json({ ok: true });
}

