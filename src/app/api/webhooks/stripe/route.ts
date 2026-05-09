import { NextResponse } from "next/server";
import Stripe from "stripe";

import { getServerEnv } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { PLANS } from "@/lib/pricing";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const env = getServerEnv();
  if (!env.STRIPE_SECRET_KEY || !env.STRIPE_WEBHOOK_SECRET) {
    return new NextResponse("Stripe not configured", { status: 400 });
  }

  const stripe = new Stripe(env.STRIPE_SECRET_KEY);

  const signature = request.headers.get("stripe-signature");
  if (!signature) return new NextResponse("Missing signature", { status: 400 });

  const body = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "invalid signature";
    return new NextResponse(`Webhook Error: ${message}`, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();

  // Idempotency: ignore already-processed event ids.
  const { data: existing } = await supabase
    .from("stripe_events")
    .select("id")
    .eq("id", event.id)
    .maybeSingle();
  if (existing?.id) {
    logger.info("stripe_event_duplicate", { eventId: event.id, type: event.type });
    return NextResponse.json({ received: true, duplicate: true });
  }

  const { error: eventInsertErr } = await supabase
    .from("stripe_events")
    .insert({ id: event.id, type: event.type });
  if (eventInsertErr) {
    // Likely duplicate insert race.
    logger.info("stripe_event_insert_race", { eventId: event.id, type: event.type });
    return NextResponse.json({ received: true, duplicate: true });
  }
  logger.info("stripe_event_processing", { eventId: event.id, type: event.type });

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.order_id;
    const jobId = session.metadata?.job_id;
    const userId = session.metadata?.user_id;
    const planId = session.metadata?.plan_id;

    if (orderId && jobId && userId && planId) {
      const planDef = PLANS.find((p) => p.id === planId);

      await supabase
        .from("orders")
        .update({
          status: "paid",
          stripe_payment_intent_id:
            typeof session.payment_intent === "string" ? session.payment_intent : null,
          stripe_checkout_session_id: session.id,
        })
        .eq("id", orderId);

      await supabase.from("stripe_checkout_sessions").upsert({
        id: session.id,
        order_id: orderId,
        user_id: userId,
        payment_intent_id:
          typeof session.payment_intent === "string" ? session.payment_intent : null,
        status: session.status ?? "complete",
        amount_total: session.amount_total ?? null,
        currency: session.currency ?? "usd",
      });

      await supabase
        .from("generation_jobs")
        .update({ status: "queued", order_id: orderId, requested_images: planDef?.images ?? 0 })
        .eq("id", jobId)
        .eq("user_id", userId);

      if (planDef) {
        // Grant credits once per order (idempotent via orders.credits_granted).
        const { data: order } = await supabase
          .from("orders")
          .select("id,credits_granted")
          .eq("id", orderId)
          .maybeSingle();
        const alreadyGranted = (order?.credits_granted as number | null) ?? 0;
        if (alreadyGranted <= 0) {
          await supabase
            .from("orders")
            .update({ credits_granted: planDef.images })
            .eq("id", orderId);
        }

        // Increment user_credits (idempotent via event table).
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

        // Ledger row with idempotent-ish key.
        await supabase.from("credit_transactions").insert({
          user_id: userId,
          order_id: orderId,
          delta: planDef.images,
          reason: `purchase:${planDef.id}:${session.id}`,
        });

        logger.info("stripe_credits_granted", { orderId, userId, credits: planDef.images, sessionId: session.id });
      }
    }
  }

  return NextResponse.json({ received: true });
}
