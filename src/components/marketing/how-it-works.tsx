import Link from "next/link";

import { Container } from "@/components/site/container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const steps = [
  {
    title: "Upload 10–20 photos",
    body: "Close-up selfies with varied angles help preserve identity.",
  },
  {
    title: "Pick your style",
    body: "Corporate, founder, finance, medical, creative — tuned for LinkedIn.",
  },
  {
    title: "Pay once, generate fast",
    body: "Checkout securely with Stripe. Track progress in your dashboard.",
  },
  {
    title: "Download and use",
    body: "Private gallery + ZIP download. LinkedIn-safe crops by default.",
  },
];

export function HowItWorks() {
  return (
    <section>
      <Container className="py-14 sm:py-20">
        <div className="flex flex-col gap-3">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            A simple, professional flow
          </h2>
          <p className="max-w-2xl text-white/65">
            Built to feel like a premium studio session — without scheduling,
            travel, or awkward photoshoots.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, idx) => (
            <Card key={s.title} className="border-white/10 bg-black/30">
              <CardHeader>
                <div className="text-xs text-white/45">Step {idx + 1}</div>
                <CardTitle className="text-white text-base">{s.title}</CardTitle>
                <CardDescription className="text-white/60">{s.body}</CardDescription>
              </CardHeader>
              <CardContent />
            </Card>
          ))}
        </div>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button asChild size="lg" className="rounded-full">
            <Link href="/upload">Create My Headshots</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="rounded-full border-white/15 bg-transparent text-white hover:bg-white/5"
          >
            <Link href="/pricing">See pricing</Link>
          </Button>
        </div>
      </Container>
    </section>
  );
}

