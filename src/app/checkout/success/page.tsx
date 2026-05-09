import Link from "next/link";
import Stripe from "stripe";

import { BetaWall } from "@/components/beta/beta-wall";
import { Container } from "@/components/site/container";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckoutSuccessClient } from "@/components/checkout/checkout-success-client";
import { getServerEnv } from "@/lib/env";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const sp = await searchParams;
  const sessionId = sp.session_id;
  return (
    <BetaWall nextPath={sessionId ? `/checkout/success?session_id=${encodeURIComponent(sessionId)}` : "/checkout/success"}>
      <CheckoutSuccessInner searchParams={searchParams} />
    </BetaWall>
  );
}

async function CheckoutSuccessInner({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const sp = await searchParams;
  const env = getServerEnv();
  const sessionId = sp.session_id;

  let jobId: string | null = null;
  if (env.STRIPE_SECRET_KEY && sessionId) {
    try {
      const stripe = new Stripe(env.STRIPE_SECRET_KEY);
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      jobId = session.metadata?.job_id ?? null;
    } catch {
      jobId = null;
    }
  }

  return (
    <main className="bg-black">
      <Container className="py-12 sm:py-16">
        <Card className="border-white/10 bg-black/30">
          <CardHeader>
            <CardTitle className="text-white">Payment successful</CardTitle>
            <CardDescription className="text-white/60">
              Your job is queued automatically. We’ll train identity from your
              uploads, generate your selected styles, and deliver results to your
              private dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {sessionId ? (
              <div className="text-xs text-white/45">
                Checkout session: {sessionId}
              </div>
            ) : null}

            <CheckoutSuccessClient sessionId={sessionId} initialJobId={jobId} />

            <div className="grid gap-2 rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-white/65">
              <div className="text-white">What happens next</div>
              <div>1) We validate your input photos.</div>
              <div>2) We generate your selected professional looks.</div>
              <div>
                3) You download individual images or a ZIP from the dashboard.
              </div>
              <div className="pt-2 text-xs text-white/45">
                Demo mode: run{" "}
                <span className="font-mono">npm run worker:once</span> to process
                a queued job locally.
              </div>
            </div>

            <Button
              asChild
              variant="outline"
              className="rounded-full border-white/15 bg-transparent text-white hover:bg-white/5"
            >
              <Link href="/upload">Create another job</Link>
            </Button>
          </CardContent>
        </Card>
      </Container>
    </main>
  );
}
