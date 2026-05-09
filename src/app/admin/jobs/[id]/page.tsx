import Link from "next/link";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/admin-auth";
import { Container } from "@/components/site/container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AdminJobActions } from "@/components/admin/admin-job-actions";
import { AdminNav } from "@/components/admin/admin-nav";

type JobRow = {
  id: string;
  user_id: string;
  status: string;
  provider: string;
  selected_styles: string[];
  input_image_paths: string[];
  error_message?: string | null;
  order_id?: string | null;
  created_at: string;
  requested_images?: number | null;
  credits_charged?: number | null;
  parent_job_id?: string | null;
  regeneration_reason?: string | null;
};

export default async function AdminJobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/dashboard");
  if (!isAdminEmail(auth.user.email)) redirect("/dashboard");

  const admin = createSupabaseAdminClient();
  const { data: job } = await admin
    .from("generation_jobs")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!job) redirect("/admin/jobs");

  const typed = job as unknown as JobRow;

  const { data: userRow } = await admin
    .from("users")
    .select("id,email,created_at")
    .eq("id", typed.user_id)
    .maybeSingle();

  const { count: uploadCount } = await admin
    .from("photo_uploads")
    .select("id", { count: "exact", head: true })
    .eq("user_id", typed.user_id)
    .in("storage_path", typed.input_image_paths ?? []);

  const { count: outputCount } = await admin
    .from("generated_images")
    .select("id", { count: "exact", head: true })
    .eq("job_id", typed.id);

  const { data: feedback } = await admin
    .from("beta_feedback")
    .select("*")
    .eq("job_id", typed.id)
    .maybeSingle();

  return (
    <main className="bg-black">
      <Container className="py-10 sm:py-14">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Admin Job Detail</h1>
            <p className="mt-2 text-white/65">
              Job {String(typed.id).slice(0, 8)} • {typed.status} • {typed.provider}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" className="rounded-full border-white/15 bg-transparent text-white hover:bg-white/5">
              <Link href="/admin/jobs">Back to jobs</Link>
            </Button>
            <Button asChild className="rounded-full">
              <Link href="/admin/users">Users</Link>
            </Button>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <AdminNav />
          <Button asChild className="rounded-full" variant="outline">
            <Link href="/dashboard">Back</Link>
          </Button>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-[0.55fr_0.45fr]">
          <Card className="border-white/10 bg-black/30">
            <CardHeader>
              <CardTitle className="text-white">Metadata</CardTitle>
              <CardDescription className="text-white/60">
                Core job fields, credits, and lineage.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm text-white/70">
              <div><span className="text-white/45">User:</span> {userRow?.email ?? typed.user_id}</div>
              <div><span className="text-white/45">Created:</span> {new Date(typed.created_at).toLocaleString()}</div>
              <div><span className="text-white/45">Order:</span> {typed.order_id ?? "—"}</div>
              <div><span className="text-white/45">Requested images:</span> {typed.requested_images ?? 0}</div>
              <div><span className="text-white/45">Credits charged:</span> {typed.credits_charged ?? 0}</div>
              <div><span className="text-white/45">Parent job:</span> {typed.parent_job_id ?? "—"}</div>
              <div><span className="text-white/45">Regen reason:</span> {typed.regeneration_reason ?? "—"}</div>
              <div><span className="text-white/45">Uploads:</span> {uploadCount ?? 0}</div>
              <div><span className="text-white/45">Generated images:</span> {outputCount ?? 0}</div>
              <div><span className="text-white/45">Selected styles:</span> {(typed.selected_styles ?? []).join(", ") || "—"}</div>
              {typed.error_message ? (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-red-100/90">
                  <div className="font-semibold">Error</div>
                  <div className="mt-1 text-sm">{typed.error_message}</div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <div className="grid gap-4">
            <Card className="border-white/10 bg-black/30">
              <CardHeader>
                <CardTitle className="text-white">Feedback</CardTitle>
                <CardDescription className="text-white/60">
                  Beta feedback for this job (if submitted).
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-white/70">
                {feedback ? (
                  <div className="grid gap-2">
                    <div>Realism: {(feedback.realism_rating as number)}/5</div>
                    <div>Identity: {(feedback.identity_rating as number)}/5</div>
                    <div>Professional: {(feedback.professional_rating as number)}/5</div>
                    <div>Would use on LinkedIn: {(feedback.would_use_linkedin as boolean) ? "Yes" : "No"}</div>
                    {feedback.comments ? (
                      <div className="rounded-xl border border-white/10 bg-black/40 p-3 text-white/75">
                        {feedback.comments as string}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="text-white/60">No feedback submitted.</div>
                )}
              </CardContent>
            </Card>

            <AdminJobActions jobId={typed.id} userId={typed.user_id} jobStatus={typed.status} creditsCharged={typed.credits_charged ?? 0} />
          </div>
        </div>
      </Container>
    </main>
  );
}
