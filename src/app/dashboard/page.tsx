import Link from "next/link";
import { redirect } from "next/navigation";

import { Container } from "@/components/site/container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SignInCard } from "@/components/auth/sign-in-card";
import { SignOutButton } from "@/components/dashboard/sign-out-button";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { BetaWall } from "@/components/beta/beta-wall";
import { requireBetaAccess } from "@/lib/beta-access";

export default async function DashboardPage() {
  return (
    <BetaWall nextPath="/dashboard">
      <DashboardInner />
    </BetaWall>
  );
}

async function DashboardInner() {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return (
      <main className="bg-black">
        <Container className="py-12 sm:py-16">
          <div className="mx-auto max-w-lg">
            <SignInCard nextPath="/dashboard" />
          </div>
        </Container>
      </main>
    );
  }

  const beta = await requireBetaAccess({
    supabase,
    userId: auth.user.id,
    userEmail: auth.user.email,
  });
  if (beta.state.enabled && beta.ok) {
    const { data: anyJob } = await supabase
      .from("generation_jobs")
      .select("id")
      .eq("user_id", auth.user.id)
      .is("deleted_at", null)
      .limit(1)
      .maybeSingle();
    if (!anyJob?.id) redirect("/onboarding");
  }

  const { data: jobs } = await supabase
    .from("generation_jobs")
    .select("id,status,created_at,selected_styles")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <main className="bg-black">
      <Container className="py-10 sm:py-14">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
            <p className="mt-2 text-white/65">Track jobs and download your headshots.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild className="rounded-full">
              <Link href="/upload">New job</Link>
            </Button>
            <SignOutButton />
          </div>
        </div>

        <div className="mt-10 grid gap-4">
          {jobs && jobs.length > 0 ? (
            jobs.map((j) => (
              <Card key={j.id} className="border-white/10 bg-black/30">
                <CardHeader>
                  <CardTitle className="text-white text-base">
                    Job {String(j.id).slice(0, 8)}
                  </CardTitle>
                  <CardDescription className="text-white/60">
                    Status: {j.status}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between gap-4">
                  <div className="text-xs text-white/50">
                    Styles: {(j.selected_styles as string[] | null)?.join(", ") || "—"}
                  </div>
                  <Button asChild size="sm" className="rounded-full">
                    <Link href={`/dashboard/job/${j.id}`}>Open</Link>
                  </Button>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="border-white/10 bg-black/30">
              <CardHeader>
                <CardTitle className="text-white">No jobs yet</CardTitle>
                <CardDescription className="text-white/60">
                  Create your first headshot job.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="rounded-full">
                  <Link href="/upload">Create My Headshots</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </Container>
    </main>
  );
}
