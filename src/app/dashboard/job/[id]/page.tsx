import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { BetaWall } from "@/components/beta/beta-wall";
import { Container } from "@/components/site/container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { JobStatusTimeline } from "@/components/dashboard/job-status-timeline";
import { DownloadButton } from "@/components/dashboard/download-button";
import { JobAutoRefresh } from "@/components/dashboard/job-auto-refresh";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { JobGallery } from "@/components/dashboard/job-gallery";
import { FeedbackPrompt } from "@/components/feedback/feedback-prompt";

export default async function JobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <BetaWall nextPath={`/dashboard/job/${encodeURIComponent(id)}`}>
      <JobInner params={params} />
    </BetaWall>
  );
}

async function JobInner({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/dashboard");

  const { data: job, error } = await supabase
    .from("generation_jobs")
    .select("*")
    .eq("id", id)
    .eq("user_id", auth.user.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw error;
  if (!job) notFound();

  // For server render, fetch signed URLs via our API from the client component later.
  // Here we show status and basic info.
  return (
    <main className="bg-black">
      <Container className="py-10 sm:py-14">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Job</h1>
            <p className="mt-2 text-white/65">Track progress and download outputs.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild variant="outline" className="rounded-full border-white/15 bg-transparent text-white hover:bg-white/5">
              <Link href="/dashboard">Back</Link>
            </Button>
            <DownloadButton href={`/api/jobs/${id}/zip`} filename={`headshots-${id}.zip`} />
          </div>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[0.35fr_0.65fr]">
          <Card className="border-white/10 bg-black/30">
            <CardHeader>
              <CardTitle className="text-white">Progress</CardTitle>
              <CardDescription className="text-white/60">Job status timeline.</CardDescription>
            </CardHeader>
            <CardContent>
              <JobStatusTimeline status={job.status as string} />
              <div className="mt-4">
                <JobAutoRefresh jobId={id} initialStatus={job.status as string} />
              </div>
            </CardContent>
          </Card>

          <JobGallery jobId={id} jobStatus={job.status as string} errorMessage={(job.error_message as string | null) ?? null} />
        </div>

        {(job.status as string) === "ready" ? (
          <div className="mt-6">
            <FeedbackPrompt jobId={id} />
          </div>
        ) : null}
      </Container>
    </main>
  );
}

// Gallery moved to a client component for filters + ratings + modals.
