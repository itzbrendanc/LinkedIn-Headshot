"use client";

import * as React from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AdminJobActions({
  jobId,
  userId,
  jobStatus,
  creditsCharged,
}: {
  jobId: string;
  userId: string;
  jobStatus: string;
  creditsCharged: number;
}) {
  const [busy, setBusy] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [amount, setAmount] = React.useState(20);

  async function post(path: string, body?: unknown, confirmMessage?: string) {
    setError(null);
    if (confirmMessage) {
      const ok = window.confirm(confirmMessage);
      if (!ok) return;
    }
    setBusy(path);
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) throw new Error(await res.text());
      window.location.reload();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card className="border-white/10 bg-black/30">
      <CardHeader>
        <CardTitle className="text-white">Admin actions</CardTitle>
        <CardDescription className="text-white/60">
          Support tools for credits and job recovery.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {error ? <div className="text-sm text-red-400">{error}</div> : null}

        <div className="grid gap-2 rounded-2xl border border-white/10 bg-black/40 p-4">
          <div className="text-sm text-white/70">Grant credits</div>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="border-white/10 bg-black/30 text-white"
            />
            <Button
              className="rounded-full"
              disabled={busy !== null || amount <= 0}
              onClick={() =>
                void post(
                  "/api/admin/credits/grant",
                  { userId, amount },
                  `Grant ${amount} credits to this user?`,
                )
              }
            >
              {busy === "/api/admin/credits/grant" ? "Granting…" : "Grant"}
            </Button>
          </div>
          <div className="text-xs text-white/45">Writes a credit transaction.</div>
        </div>

        <div className="grid gap-2 rounded-2xl border border-white/10 bg-black/40 p-4">
          <div className="text-sm text-white/70">Job recovery</div>
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              className="rounded-full"
              disabled={busy !== null}
              onClick={() =>
                void post(
                  `/api/admin/jobs/${encodeURIComponent(jobId)}/retry`,
                  undefined,
                  "Retry this job? This will set it back to queued for the worker.",
                )
              }
            >
              {busy === `/api/admin/jobs/${encodeURIComponent(jobId)}/retry`
                ? "Retrying…"
                : "Retry failed job (set queued)"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-full border-white/15 bg-transparent text-white hover:bg-white/5"
              disabled={busy !== null}
              onClick={() =>
                void post(
                  `/api/admin/jobs/${encodeURIComponent(jobId)}/mark-failed`,
                  undefined,
                  "Mark this job as failed? The user will see a failure state.",
                )
              }
            >
              {busy === `/api/admin/jobs/${encodeURIComponent(jobId)}/mark-failed`
                ? "Marking…"
                : "Mark job failed"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-full border-white/15 bg-transparent text-white hover:bg-white/5"
              disabled={busy !== null || creditsCharged <= 0}
              onClick={() =>
                void post(
                  `/api/admin/jobs/${encodeURIComponent(jobId)}/refund`,
                  undefined,
                  `Refund ${creditsCharged} credits for this job? This cannot be undone.`,
                )
              }
            >
              {busy === `/api/admin/jobs/${encodeURIComponent(jobId)}/refund`
                ? "Refunding…"
                : `Refund credits for job (${creditsCharged})`}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-full border-red-500/40 bg-transparent text-red-200 hover:bg-red-500/10"
              disabled={busy !== null}
              onClick={() =>
                void post(
                  `/api/admin/jobs/${encodeURIComponent(jobId)}/delete-abusive`,
                  undefined,
                  "Delete this job as abusive? This removes generated outputs and hides the job from the user.",
                )
              }
            >
              {busy === `/api/admin/jobs/${encodeURIComponent(jobId)}/delete-abusive`
                ? "Deleting…"
                : "Delete abusive job"}
            </Button>
          </div>
        </div>

        <div className="text-xs text-white/45">
          Current status: {jobStatus}. Refund is blocked if already refunded via ledger key.
        </div>
      </CardContent>
    </Card>
  );
}
