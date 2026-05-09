import { NextResponse } from "next/server";
import { z } from "zod";
import Stripe from "stripe";

import { getServerEnv } from "@/lib/env";
import { PLANS } from "@/lib/pricing";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { rateLimit } from "@/lib/rate-limit";
import { requireBetaAccess } from "@/lib/beta-access";

const schema = z.object({
  jobId: z.string().uuid(),
  plan: z.string(),
  selectedStyles: z.array(z.string().min(1)).min(1),
});

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return new NextResponse("Unauthorized", { status: 401 });

  const beta = await requireBetaAccess({
    supabase,
    userId: auth.user.id,
    userEmail: auth.user.email,
  });
  if (!beta.ok) return new NextResponse("Private beta access required.", { status: 403 });

  const rl = rateLimit(`checkout:${auth.user.id}`, { capacity: 10, refillPerSecond: 1 / 10 });
  if (!rl.allowed) return new NextResponse("Too many requests. Try again later.", { status: 429 });

  const env = getServerEnv();
  const body = schema.parse(await request.json());
  const planDef = PLANS.find((p) => p.id === body.plan);
  if (!planDef) return new NextResponse("Invalid plan", { status: 400 });
  if (planDef.includedStyles !== "all" && body.selectedStyles.length > planDef.includedStyles) {
    return new NextResponse(`Too many styles for plan (max ${planDef.includedStyles}).`, { status: 400 });
  }

  const { data: job, error: jobSelectErr } = await supabase
    .from("generation_jobs")
    .select("id,user_id,input_image_paths,consent_confirmed")
    .eq("id", body.jobId)
    .eq("user_id", auth.user.id)
    .maybeSingle();
  if (jobSelectErr) return new NextResponse(jobSelectErr.message, { status: 400 });
  if (!job) return new NextResponse("Job not found", { status: 404 });
  const inputPaths = (job.input_image_paths as string[]) ?? [];
  if (inputPaths.length < 10) return new NextResponse("Upload at least 10 images first.", { status: 400 });
  if (!(job.consent_confirmed as boolean)) return new NextResponse("Consent is required.", { status: 400 });

  // If Stripe isn't configured, keep dev flow unblocked.
  if (!env.STRIPE_SECRET_KEY) {
    await supabase
      .from("generation_jobs")
      .update({ selected_styles: body.selectedStyles })
      .eq("id", body.jobId)
      .eq("user_id", auth.user.id);
    return NextResponse.json({ checkoutUrl: null });
  }

  const stripe = new Stripe(env.STRIPE_SECRET_KEY);

  const amountCents = planDef.priceUsd * 100;

  // Create an order row first (source of truth on our side).
  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .insert({
      user_id: auth.user.id,
      plan_id: planDef.id,
      amount_cents: amountCents,
      currency: "usd",
      status: "created",
      credits_granted: planDef.images,
    })
    .select("id")
    .single();
  if (orderErr) return new NextResponse(orderErr.message, { status: 400 });

  // Attach order to job + selected styles.
  const { error: jobUpdateErr } = await supabase
    .from("generation_jobs")
    .update({ order_id: order.id, selected_styles: body.selectedStyles })
    .eq("id", body.jobId)
    .eq("user_id", auth.user.id);
  if (jobUpdateErr) return new NextResponse(jobUpdateErr.message, { status: 400 });

  const siteUrl = env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: auth.user.email ?? undefined,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: amountCents,
          product_data: {
            name: `Headshot Company — ${planDef.name}`,
            description: `${planDef.images} images • up to ${planDef.includedStyles} styles`,
          },
        },
      },
    ],
    success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/styles?job=${encodeURIComponent(body.jobId)}&plan=${encodeURIComponent(planDef.id)}`,
    metadata: {
      order_id: order.id,
      job_id: body.jobId,
      user_id: auth.user.id,
      plan_id: planDef.id,
    },
  });
  logger.info("checkout_session_created", { userId: auth.user.id, orderId: order.id, jobId: body.jobId, sessionId: session.id });

  // Store checkout session id.
  await supabase
    .from("orders")
    .update({ stripe_checkout_session_id: session.id })
    .eq("id", order.id)
    .eq("user_id", auth.user.id);

  return NextResponse.json({ checkoutUrl: session.url });
}
