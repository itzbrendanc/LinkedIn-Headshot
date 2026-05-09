import Link from "next/link";
import { redirect } from "next/navigation";

import { BetaWall } from "@/components/beta/beta-wall";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Container } from "@/components/site/container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function OnboardingPage() {
  return (
    <BetaWall nextPath="/onboarding">
      <OnboardingInner />
    </BetaWall>
  );
}

async function OnboardingInner() {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/dashboard");

  return (
    <main className="bg-black">
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-semibold tracking-tight">Welcome</h1>
          <p className="mt-2 text-white/65">
            You’re in the private beta. Here’s the quickest path to great results.
          </p>
        </div>

        <div className="mx-auto mt-10 grid max-w-3xl gap-4">
          <Card className="border-white/10 bg-black/30">
            <CardHeader>
              <CardTitle className="text-white">How it works</CardTitle>
              <CardDescription className="text-white/60">
                Built for realism and professional outcomes.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm text-white/65">
              <div>1) Upload 10–20 clear selfies (close-up, varied angles).</div>
              <div>2) Choose professional styles (corporate, founder, finance, etc.).</div>
              <div>3) Pay securely with Stripe.</div>
              <div>4) Receive LinkedIn-ready headshots in your private dashboard.</div>
              <div className="pt-2 text-xs text-white/45">
                Privacy: uploads and results are private to your account by default.
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button asChild size="lg" className="rounded-full">
              <Link href="/upload">Start my headshots</Link>
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
        </div>
      </Container>
    </main>
  );
}
