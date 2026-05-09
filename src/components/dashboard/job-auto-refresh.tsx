"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

const REFRESH_STATUSES = new Set([
  "queued",
  "uploaded",
  "training",
  "training_identity",
  "generating",
  "enhancing",
]);

export function JobAutoRefresh({
  jobId,
  initialStatus,
  intervalMs = 4000,
}: {
  jobId: string;
  initialStatus: string;
  intervalMs?: number;
}) {
  const router = useRouter();
  const [status, setStatus] = React.useState(initialStatus);
  const [lastUpdatedAt, setLastUpdatedAt] = React.useState<Date | null>(null);

  React.useEffect(() => {
    if (!REFRESH_STATUSES.has(status)) return;

    let cancelled = false;
    const timer = setInterval(async () => {
      try {
        const res = await fetch(`/api/jobs/${encodeURIComponent(jobId)}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const json = (await res.json()) as { status?: string };
        if (!cancelled && typeof json.status === "string") {
          setStatus(json.status);
          setLastUpdatedAt(new Date());
        }
        router.refresh();
      } catch {
        // Ignore transient polling issues.
      }
    }, intervalMs);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [jobId, intervalMs, router, status]);

  if (!REFRESH_STATUSES.has(status)) return null;

  return (
    <div className="text-xs text-white/45">
      Live updates on.{" "}
      {lastUpdatedAt ? `Last updated ${lastUpdatedAt.toLocaleTimeString()}.` : ""}
    </div>
  );
}
