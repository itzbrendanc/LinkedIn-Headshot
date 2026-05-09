"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";

type JobRow = {
  id: string;
  user_id: string;
  status: string;
  provider: string;
  error_message?: string | null;
  created_at: string;
  is_abusive?: boolean | null;
};

export function AdminJobsClient({ initialJobs }: { initialJobs: JobRow[] }) {
  const [jobs, setJobs] = React.useState(initialJobs);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function deleteJob(jobId: string) {
    setError(null);
    setBusy(jobId);
    try {
      const ok = window.confirm(
        "Delete this job? This removes generated outputs and marks the job deleted.",
      );
      if (!ok) return;
      const res = await fetch(`/api/admin/jobs/${encodeURIComponent(jobId)}/delete`, { method: "POST" });
      if (!res.ok) throw new Error(await res.text());
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete job.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="grid gap-3">
      {error ? <div className="text-sm text-red-400">{error}</div> : null}
      {jobs.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-black/40 p-6 text-sm text-white/60">
          No jobs yet.
        </div>
      ) : null}
      {jobs.map((j) => (
        <div
          key={j.id}
          className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-black/40 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0">
            <div className="text-sm text-white">
              <a className="underline-offset-4 hover:underline" href={`/admin/jobs/${encodeURIComponent(j.id)}`}>
                {String(j.id).slice(0, 8)}
              </a>{" "}
              • {j.status} • {j.provider}
            </div>
            <div className="text-xs text-white/50">
              user_id: {j.user_id} • {new Date(j.created_at).toLocaleString()}
            </div>
            {j.error_message ? (
              <div className="mt-2 text-xs text-red-200/80">
                {j.error_message}
              </div>
            ) : null}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button asChild variant="outline" className="rounded-full border-white/15 bg-transparent text-white hover:bg-white/5">
              <a href={`/admin/jobs/${encodeURIComponent(j.id)}`}>View</a>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-full border-red-500/40 bg-transparent text-red-200 hover:bg-red-500/10"
              disabled={busy === j.id}
              onClick={() => void deleteJob(j.id)}
            >
              Delete job
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
