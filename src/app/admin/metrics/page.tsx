import { redirect } from "next/navigation";
import Link from "next/link";

import { Container } from "@/components/site/container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin-auth";
import { AdminNav } from "@/components/admin/admin-nav";

function formatUsdCents(cents: number) {
  const dollars = cents / 100;
  return dollars.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

export default async function AdminMetricsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/dashboard");
  if (!isAdminEmail(auth.user.email)) redirect("/dashboard");

  const admin = createSupabaseAdminClient();

  const [{ count: userCount }, { data: jobs }, { data: credits }, { data: sessions }, { data: feedback }] =
    await Promise.all([
      admin.from("users").select("id", { count: "exact", head: true }),
      admin.from("generation_jobs").select("status").is("deleted_at", null).limit(10000),
      admin.from("user_credits").select("lifetime_purchased,lifetime_used").limit(100000),
      admin
        .from("stripe_checkout_sessions")
        .select("amount_total,status,currency")
        .eq("currency", "usd")
        .limit(100000),
      admin
        .from("beta_feedback")
        .select("realism_rating,identity_rating,professional_rating,would_use_linkedin")
        .limit(100000),
    ]);

  const jobRows = jobs ?? [];
  const totalJobs = jobRows.length;
  const jobsByStatus = jobRows.reduce<Record<string, number>>((acc, row) => {
    const status = (row as { status?: string | null }).status ?? "unknown";
    acc[status] = (acc[status] ?? 0) + 1;
    return acc;
  }, {});

  const creditRows = (credits ?? []) as Array<{ lifetime_purchased: number; lifetime_used: number }>;
  const creditsSold = creditRows.reduce((sum, r) => sum + (r.lifetime_purchased ?? 0), 0);
  const creditsUsed = creditRows.reduce((sum, r) => sum + (r.lifetime_used ?? 0), 0);

  const revenueCents = (sessions ?? [])
    .filter((s) => (s as { status?: string | null }).status === "complete")
    .reduce((sum, s) => sum + (((s as { amount_total?: number | null }).amount_total as number | null) ?? 0), 0);

  const feedbackRows = (feedback ?? []) as Array<{
    realism_rating: number;
    identity_rating: number;
    professional_rating: number;
    would_use_linkedin: boolean;
  }>;
  const feedbackCount = feedbackRows.length;
  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
  const avgRealism = avg(feedbackRows.map((r) => r.realism_rating));
  const avgIdentity = avg(feedbackRows.map((r) => r.identity_rating));
  const avgProfessional = avg(feedbackRows.map((r) => r.professional_rating));
  const wouldUsePct =
    feedbackCount > 0
      ? (feedbackRows.filter((r) => r.would_use_linkedin).length / feedbackCount) * 100
      : null;

  const statusRows = Object.entries(jobsByStatus).sort((a, b) => b[1] - a[1]);

  return (
    <main className="bg-black">
      <Container className="py-10 sm:py-14">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Metrics</h1>
            <p className="mt-2 text-white/65">
              Beta-era founder dashboard (MVP). Revenue shown for completed USD Checkout sessions.
            </p>
          </div>
          <Button asChild className="rounded-full">
            <Link href="/admin/jobs">Admin</Link>
          </Button>
        </div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <AdminNav />
          <Button asChild className="rounded-full" variant="outline">
            <Link href="/dashboard">Back</Link>
          </Button>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <Card className="border-white/10 bg-black/30">
            <CardHeader>
              <CardTitle className="text-white">Users</CardTitle>
              <CardDescription className="text-white/60">Total accounts created</CardDescription>
            </CardHeader>
            <CardContent className="text-3xl font-semibold text-white">{userCount ?? 0}</CardContent>
          </Card>
          <Card className="border-white/10 bg-black/30">
            <CardHeader>
              <CardTitle className="text-white">Jobs</CardTitle>
              <CardDescription className="text-white/60">Non-deleted jobs (last 10k)</CardDescription>
            </CardHeader>
            <CardContent className="text-3xl font-semibold text-white">{totalJobs}</CardContent>
          </Card>
          <Card className="border-white/10 bg-black/30">
            <CardHeader>
              <CardTitle className="text-white">Revenue</CardTitle>
              <CardDescription className="text-white/60">Completed USD sessions</CardDescription>
            </CardHeader>
            <CardContent className="text-3xl font-semibold text-white">{formatUsdCents(revenueCents)}</CardContent>
          </Card>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <Card className="border-white/10 bg-black/30">
            <CardHeader>
              <CardTitle className="text-white">Credits sold</CardTitle>
              <CardDescription className="text-white/60">Lifetime purchased</CardDescription>
            </CardHeader>
            <CardContent className="text-3xl font-semibold text-white">{creditsSold}</CardContent>
          </Card>
          <Card className="border-white/10 bg-black/30">
            <CardHeader>
              <CardTitle className="text-white">Credits used</CardTitle>
              <CardDescription className="text-white/60">Lifetime consumed</CardDescription>
            </CardHeader>
            <CardContent className="text-3xl font-semibold text-white">{creditsUsed}</CardContent>
          </Card>
          <Card className="border-white/10 bg-black/30">
            <CardHeader>
              <CardTitle className="text-white">Feedback</CardTitle>
              <CardDescription className="text-white/60">Total submissions</CardDescription>
            </CardHeader>
            <CardContent className="text-3xl font-semibold text-white">{feedbackCount}</CardContent>
          </Card>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <Card className="border-white/10 bg-black/30">
            <CardHeader>
              <CardTitle className="text-white">Jobs by status</CardTitle>
              <CardDescription className="text-white/60">Counts (last 10k)</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              {statusRows.length ? (
                statusRows.map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between text-sm text-white">
                    <span className="text-white/70">{status}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))
              ) : (
                <div className="text-sm text-white/60">No jobs yet.</div>
              )}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-black/30">
            <CardHeader>
              <CardTitle className="text-white">Quality signals</CardTitle>
              <CardDescription className="text-white/60">Averages across submissions</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm text-white">
              <div className="flex items-center justify-between">
                <span className="text-white/70">Avg realism</span>
                <span className="font-medium">{avgRealism ? avgRealism.toFixed(2) : "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/70">Avg identity</span>
                <span className="font-medium">{avgIdentity ? avgIdentity.toFixed(2) : "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/70">Avg professional</span>
                <span className="font-medium">{avgProfessional ? avgProfessional.toFixed(2) : "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/70">Would use on LinkedIn</span>
                <span className="font-medium">
                  {wouldUsePct === null ? "—" : `${wouldUsePct.toFixed(0)}%`}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </Container>
    </main>
  );
}
