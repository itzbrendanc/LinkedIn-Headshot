import Link from "next/link";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/admin-auth";
import { Container } from "@/components/site/container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AdminNav } from "@/components/admin/admin-nav";

type FeedbackRow = {
  id: string;
  user_id: string;
  job_id: string;
  realism_rating: number;
  identity_rating: number;
  professional_rating: number;
  would_use_linkedin: boolean;
  comments?: string | null;
  created_at: string;
};

export default async function AdminFeedbackPage() {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/dashboard");

  if (!isAdminEmail(auth.user.email)) {
    redirect("/dashboard");
  }

  const admin = createSupabaseAdminClient();
  const { data: feedback } = await admin
    .from("beta_feedback")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  // Optional: look up emails (best effort).
  const userIds = Array.from(new Set((feedback ?? []).map((f) => f.user_id as string)));
  const emailsByUserId = new Map<string, string>();
  if (userIds.length) {
    const { data: users } = await admin.from("users").select("id,email").in("id", userIds);
    for (const u of users ?? []) {
      emailsByUserId.set(u.id as string, (u.email as string) ?? "");
    }
  }

  return (
    <main className="bg-black">
      <Container className="py-10 sm:py-14">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Admin Feedback</h1>
            <p className="mt-2 text-white/65">Private beta feedback submissions.</p>
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
              <CardTitle className="text-white">Recent feedback</CardTitle>
              <CardDescription className="text-white/60">
                User email, job id, ratings, and comments.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {(feedback ?? []).map((f) => {
                const row = f as unknown as FeedbackRow;
                return (
                  <div
                    key={row.id}
                    className="rounded-2xl border border-white/10 bg-black/40 p-4"
                  >
                    <div className="text-sm text-white">
                      {emailsByUserId.get(row.user_id) || row.user_id} • job{" "}
                      {String(row.job_id).slice(0, 8)}
                    </div>
                    <div className="mt-1 text-xs text-white/50">
                      {new Date(row.created_at).toLocaleString()} • Would use on
                      LinkedIn: {row.would_use_linkedin ? "Yes" : "No"}
                    </div>
                    <div className="mt-3 grid gap-1 text-sm text-white/70 sm:grid-cols-3">
                      <div>Realism: {row.realism_rating}/5</div>
                      <div>Identity: {row.identity_rating}/5</div>
                      <div>Professional: {row.professional_rating}/5</div>
                    </div>
                    {row.comments ? (
                      <div className="mt-3 text-sm text-white/75">
                        {row.comments}
                      </div>
                    ) : null}
                  </div>
                );
              })}
              {(feedback ?? []).length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-black/40 p-6 text-sm text-white/60">
                  No feedback yet.
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </Container>
    </main>
  );
}
