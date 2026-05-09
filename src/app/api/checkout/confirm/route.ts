import { NextResponse } from "next/server";
import { z } from "zod";
import Stripe from "stripe";

import { getServerEnv } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PLANS } from "@/lib/pricing";

const schema = z.object({
  sessionId: z.string().min(1),
});

export const runtime = "nodejs";

export async function POST(request: Request) {
  const env = getServerEnv();
  if (!env.STRIPE_SECRET_KEY) {
    return new NextResponse("Stripe not configured", { status: 400 });
  }

  const sessionSupabase = await createSupabaseServerClient();
  const { data: auth } = await sessionSupabase.auth.getUser();
  if (!auth.user) return new NextResponse("Unauthorized", { status: 401 });

  const { sessionId } = schema.parse(await request.json());
  const stripe = new Stripe(env.STRIPE_SECRET_KEY);
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.payment_status !== "paid") {
    return new NextResponse("Payment not completed yet.", { status: 409 });
  }

  const orderId = session.metadata?.order_id;
  const jobId = session.metadata?.job_id;
  const userId = session.metadata?.user_id;
  const planId = session.metadata?.plan_id;
  if (!orderId || !jobId || !userId || !planId) {
    return new NextResponse("Missing session metadata.", { status: 400 });
  }

  if (auth.user.id !== userId) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const supabase = createSupabaseAdminClient();
  const planDef = PLANS.find((p) => p.id === planId);

  // Idempotency: if we've already recorded this session, just return.
  const { data: existingSession } = await supabase
    .from("stripe_checkout_sessions")
    .select("id")
    .eq("id", session.id)
    .maybeSingle();
  if (existingSession?.id) {
    return NextResponse.json({ ok: true, jobId });
  }

  await supabase
    .from("orders")
    .update({
      status: "paid",
      stripe_payment_intent_id:
        typeof session.payment_intent === "string" ? session.payment_intent : null,
      stripe_checkout_session_id: session.id,
    })
    .eq("id", orderId);

  await supabase
    .from("generation_jobs")
    .update({ status: "queued", order_id: orderId, requested_images: planDef?.images ?? 0 })
    .eq("id", jobId)
    .eq("user_id", userId);

  if (planDef) {
    await supabase.from("stripe_checkout_sessions").insert({
      id: session.id,
      order_id: orderId,
      user_id: userId,
      payment_intent_id:
        typeof session.payment_intent === "string" ? session.payment_intent : null,
      status: session.status ?? "complete",
      amount_total: session.amount_total ?? null,
      currency: session.currency ?? "usd",
    });

    const { data: creditsRow, error: creditsErr } = await supabase
      .from("user_credits")
      .select("user_id,balance,lifetime_purchased,lifetime_used")
      .eq("user_id", userId)
      .maybeSingle();
    if (creditsErr) throw creditsErr;
    if (!creditsRow) {
      await supabase.from("user_credits").insert({
        user_id: userId,
        balance: planDef.images,
        lifetime_purchased: planDef.images,
        lifetime_used: 0,
      });
    } else {
      await supabase
        .from("user_credits")
        .update({
          balance: (creditsRow.balance as number) + planDef.images,
          lifetime_purchased:
            (creditsRow.lifetime_purchased as number) + planDef.images,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);
    }

    await supabase.from("credit_transactions").insert({
      user_id: userId,
      order_id: orderId,
      delta: planDef.images,
      reason: `purchase:${planDef.id}:${session.id}`,
    });
  }

  return NextResponse.json({ ok: true, jobId });
}
