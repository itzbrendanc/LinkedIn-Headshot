"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function CheckoutSuccessClient({
  sessionId,
  initialJobId,
}: {
  sessionId?: string;
  initialJobId?: string | null;
}) {
  const router = useRouter();
  const [jobId, setJobId] = React.useState<string | null>(initialJobId ?? null);
  const [status, setStatus] = React.useState<"idle" | "confirming" | "error">(
    "idle",
  );

  React.useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;

    async function run() {
      setStatus("confirming");
      try {
        const res = await fetch("/api/checkout/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });

        if (!res.ok && res.status !== 409) throw new Error(await res.text());
        if (res.ok) {
          const json = (await res.json()) as { jobId: string };
          if (!cancelled) setJobId(json.jobId);
        }

        router.refresh();
      } catch {
        if (!cancelled) setStatus("error");
        return;
      } finally {
        if (!cancelled) setStatus("idle");
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [sessionId, router]);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <Button asChild size="lg" className="rounded-full">
        <Link href="/dashboard">Go to dashboard</Link>
      </Button>
      {jobId ? (
        <Button
          asChild
          size="lg"
          variant="outline"
          className="rounded-full border-white/15 bg-transparent text-white hover:bg-white/5"
        >
          <Link href={`/dashboard/job/${encodeURIComponent(jobId)}`}>
            View job
          </Link>
        </Button>
      ) : null}
      {status === "confirming" ? (
        <div className="text-sm text-white/60">Finalizing your order…</div>
      ) : null}
      {status === "error" ? (
        <div className="text-sm text-red-400">
          We couldn’t confirm your payment yet. Your job should still appear in
          the dashboard shortly.
        </div>
      ) : null}
    </div>
  );
}

