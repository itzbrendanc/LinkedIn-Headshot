"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { UploadDropzone } from "@/components/upload/upload-dropzone";
import { PhotoQualityChecklist } from "@/components/upload/photo-quality-checklist";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function UploadFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan") ?? "pro";

  const [confirmed, setConfirmed] = React.useState(false);
  const [inputPaths, setInputPaths] = React.useState<string[] | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const consentText =
    "I confirm these are photos of me and I have permission to use them.";

  async function createJobAndContinue(paths: string[]) {
    setError(null);
    if (!confirmed) {
      setError("Please confirm consent before continuing.");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inputImagePaths: paths,
          plan,
          consentConfirmed: true,
          consentText,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const json = (await res.json()) as { jobId: string };
      router.push(`/styles?job=${encodeURIComponent(json.jobId)}&plan=${encodeURIComponent(plan)}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create job.";
      setError(message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="grid gap-5">
      <div className="grid gap-4 lg:grid-cols-2">
        <UploadDropzone
          onComplete={(paths) => {
            setInputPaths(paths);
          }}
        />
        <PhotoQualityChecklist />
      </div>
      <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/30 p-4">
        <Checkbox
          checked={confirmed}
          onCheckedChange={(v) => setConfirmed(Boolean(v))}
          className="mt-0.5"
        />
        <div className="grid gap-1">
          <Label className="text-white">
            {consentText}
          </Label>
          <p className="text-xs text-white/50">
            No minors, no celebrity/impersonation use. Uploaded photos are private and used only to generate your headshots.
          </p>
        </div>
      </div>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      {inputPaths ? (
        <div className="flex items-center justify-end">
          <Button
            type="button"
            className="rounded-full"
            disabled={creating}
            onClick={() => void createJobAndContinue(inputPaths)}
          >
            Continue to styles
          </Button>
        </div>
      ) : null}
    </div>
  );
}
