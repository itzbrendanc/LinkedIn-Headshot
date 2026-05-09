import Link from "next/link";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/admin-auth";
import { Container } from "@/components/site/container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AdminNav } from "@/components/admin/admin-nav";

type UserRow = {
  id: string;
  email?: string | null;
  created_at: string;
};

export default async function AdminUsersPage() {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/dashboard");
  if (!isAdminEmail(auth.user.email)) redirect("/dashboard");

  const admin = createSupabaseAdminClient();

  const { data: users } = await admin
    .from("users")
    .select("id,email,created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  const userIds = (users ?? []).map((u) => u.id as string);

  const creditsByUserId = new Map<string, number>();
  if (userIds.length) {
    const { data: credits } = await admin
      .from("user_credits")
      .select("user_id,balance")
      .in("user_id", userIds);
    for (const c of credits ?? []) {
      creditsByUserId.set(c.user_id as string, (c.balance as number) ?? 0);
    }
  }

  const jobsCountByUserId = new Map<string, number>();
  const latestJobStatusByUserId = new Map<string, string>();
  if (userIds.length) {
    const { data: jobs } = await admin
      .from("generation_jobs")
      .select("user_id,status,created_at")
      .in("user_id", userIds)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    for (const j of jobs ?? []) {
      const uid = j.user_id as string;
      jobsCountByUserId.set(uid, (jobsCountByUserId.get(uid) ?? 0) + 1);
      if (!latestJobStatusByUserId.has(uid)) {
        latestJobStatusByUserId.set(uid, (j.status as string) ?? "—");
      }
    }
  }

  const feedbackCountByUserId = new Map<string, number>();
  if (userIds.length) {
    const { data: feedback } = await admin
      .from("beta_feedback")
      .select("user_id")
      .in("user_id", userIds);
    for (const f of feedback ?? []) {
      const uid = f.user_id as string;
      feedbackCountByUserId.set(uid, (feedbackCountByUserId.get(uid) ?? 0) + 1);
    }
  }

  return (
    <main className="bg-black">
      <Container className="py-10 sm:py-14">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Admin Users</h1>
            <p className="mt-2 text-white/65">
              Support view for beta users: credits, jobs, and feedback.
            </p>
          </div>
          <Button asChild className="rounded-full" variant="outline">
            <Link href="/dashboard">Back</Link>
          </Button>
        </div>
        <div className="mt-4">
          <AdminNav />
        </div>

        <div className="mt-10">
          <Card className="border-white/10 bg-black/30">
            <CardHeader>
              <CardTitle className="text-white">Recent users</CardTitle>
              <CardDescription className="text-white/60">
                Tip: click through to job detail pages for refund/retry.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              {(users ?? []).map((u) => {
                const user = u as unknown as UserRow;
                const credits = creditsByUserId.get(user.id) ?? 0;
                const jobsCount = jobsCountByUserId.get(user.id) ?? 0;
                const latestStatus = latestJobStatusByUserId.get(user.id) ?? "—";
                const feedbackCount = feedbackCountByUserId.get(user.id) ?? 0;
                return (
                  <div
                    key={user.id}
                    className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-black/40 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="text-sm text-white">{user.email || user.id}</div>
                      <div className="text-xs text-white/50">
                        Created: {new Date(user.created_at).toLocaleString()}
                      </div>
                    </div>
                    <div className="grid gap-1 text-xs text-white/60 sm:text-right">
                      <div>Credits: {credits}</div>
                      <div>Jobs: {jobsCount} • Latest: {latestStatus}</div>
                      <div>Feedback: {feedbackCount}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        asChild
                        size="sm"
                        className="rounded-full"
                      >
                        <Link href={`/admin/jobs?user=${encodeURIComponent(user.id)}`}>
                          View jobs
                        </Link>
                      </Button>
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="rounded-full border-white/15 bg-transparent text-white hover:bg-white/5"
                      >
                        <Link href="/admin/feedback">Feedback</Link>
                      </Button>
                    </div>
                  </div>
                );
              })}
              {(users ?? []).length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-black/40 p-6 text-sm text-white/60">
                  No users yet.
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </Container>
    </main>
  );
}
