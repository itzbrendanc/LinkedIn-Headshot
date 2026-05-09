"use client";

import * as React from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function Stars({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => {
        const v = i + 1;
        return (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            className={[
              "h-9 w-9 rounded-full border text-sm transition-colors",
              v <= value ? "border-white/20 bg-white/10 text-white" : "border-white/10 bg-black/30 text-white/40",
            ].join(" ")}
          >
            {v}
          </button>
        );
      })}
    </div>
  );
}

export function FeedbackPrompt({ jobId }: { jobId: string }) {
  const [realism, setRealism] = React.useState(5);
  const [identity, setIdentity] = React.useState(5);
  const [professional, setProfessional] = React.useState(5);
  const [wouldUse, setWouldUse] = React.useState(true);
  const [comments, setComments] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function submit() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId,
          realism,
          identity,
          professional,
          wouldUseLinkedIn: wouldUse,
          comments,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setDone(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit feedback.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <Card className="border-white/10 bg-black/30">
        <CardHeader>
          <CardTitle className="text-white">Thank you</CardTitle>
          <CardDescription className="text-white/60">
            Your feedback helps us improve realism and identity accuracy.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-white/10 bg-black/30">
      <CardHeader>
        <CardTitle className="text-white">Private beta feedback</CardTitle>
        <CardDescription className="text-white/60">
          Quick ratings help us tune realism and professional outcomes.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <div className="text-sm text-white/70">Realism</div>
          <Stars value={realism} onChange={setRealism} />
        </div>
        <div className="grid gap-2">
          <div className="text-sm text-white/70">Identity accuracy</div>
          <Stars value={identity} onChange={setIdentity} />
        </div>
        <div className="grid gap-2">
          <div className="text-sm text-white/70">Professional quality</div>
          <Stars value={professional} onChange={setProfessional} />
        </div>
        <div className="grid gap-2">
          <div className="text-sm text-white/70">Would you use this on LinkedIn?</div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={wouldUse ? "default" : "outline"}
              className={wouldUse ? "rounded-full" : "rounded-full border-white/15 bg-transparent text-white hover:bg-white/5"}
              onClick={() => setWouldUse(true)}
            >
              Yes
            </Button>
            <Button
              type="button"
              variant={!wouldUse ? "default" : "outline"}
              className={!wouldUse ? "rounded-full" : "rounded-full border-white/15 bg-transparent text-white hover:bg-white/5"}
              onClick={() => setWouldUse(false)}
            >
              No
            </Button>
          </div>
        </div>
        <div className="grid gap-2">
          <div className="text-sm text-white/70">Comments (optional)</div>
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            className="min-h-28 rounded-2xl border border-white/10 bg-black/30 p-3 text-sm text-white placeholder:text-white/40"
            placeholder="What looked best/worst? Anything that felt ‘AI’? Anything we should change for LinkedIn?"
          />
        </div>
        {error ? <div className="text-sm text-red-400">{error}</div> : null}
        <Button className="rounded-full" disabled={loading} onClick={() => void submit()}>
          {loading ? "Submitting…" : "Submit feedback"}
        </Button>
      </CardContent>
    </Card>
  );
}

