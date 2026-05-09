"use client";

import Link from "next/link";

import { PLANS, type PlanId } from "@/lib/pricing";
import { Container } from "@/components/site/container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function PricingCards({ ctaHref = "/upload" }: { ctaHref?: string }) {
  return (
    <section>
      <Container className="py-14 sm:py-20">
        <div className="flex flex-col gap-3">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Pricing</h2>
          <p className="max-w-2xl text-white/65">
            Simple, transparent plans. You only pay when you’re ready to generate.
          </p>
        </div>
        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {PLANS.map((p) => (
            <PlanCard key={p.id} planId={p.id} ctaHref={ctaHref} />
          ))}
        </div>
      </Container>
    </section>
  );
}

function PlanCard({ planId, ctaHref }: { planId: PlanId; ctaHref: string }) {
  const plan = PLANS.find((p) => p.id === planId)!;
  const featured = plan.id === "pro";
  return (
    <Card
      className={[
        "relative border-white/10 bg-black/30",
        featured ? "ring-1 ring-white/20" : "",
      ].join(" ")}
    >
      {featured ? (
        <div className="absolute -top-3 left-6">
          <Badge className="border-white/10 bg-white/10 text-white">Most popular</Badge>
        </div>
      ) : null}
      <CardHeader>
        <CardTitle className="text-white">{plan.name}</CardTitle>
        <CardDescription className="text-white/60">{plan.blurb}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-2">
          <div className="text-4xl font-semibold tracking-tight">${plan.priceUsd}</div>
          <div className="pb-1 text-sm text-white/50">one-time</div>
        </div>
        <div className="mt-6 grid gap-2 text-sm text-white/70">
          {plan.highlights.map((h) => (
            <div key={h} className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-white/50" />
              <span>{h}</span>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-3">
        <Button asChild size="lg" className="w-full rounded-full">
          <Link href={`${ctaHref}?plan=${plan.id}`}>Choose {plan.name}</Link>
        </Button>
        <div className="text-xs text-white/45">
          Includes private dashboard + downloads.
        </div>
      </CardFooter>
    </Card>
  );
}

