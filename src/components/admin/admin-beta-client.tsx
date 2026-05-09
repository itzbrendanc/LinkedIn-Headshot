"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type CodeRow = {
  code: string;
  label?: string | null;
  note?: string | null;
  max_redemptions?: number | null;
  disabled: boolean;
  created_at: string;
  redeemed_count: number;
};

export function AdminBetaClient({
  initialCodes,
  recentRedemptions,
}: {
  initialCodes: CodeRow[];
  recentRedemptions: Array<{ userId: string; email: string; code: string; redeemedAt: string }>;
}) {
  const [codes, setCodes] = React.useState(initialCodes);
  const [generating, setGenerating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState<string | null>(null);

  const [count, setCount] = React.useState(10);
  const [label, setLabel] = React.useState("");
  const [note, setNote] = React.useState("");
  const [maxRedemptions, setMaxRedemptions] = React.useState<number | "">("");

  async function generate() {
    setError(null);
    setGenerating(true);
    try {
      const res = await fetch("/api/admin/beta/codes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          count,
          label: label || null,
          note: note || null,
          maxRedemptions: maxRedemptions === "" ? null : maxRedemptions,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const json = (await res.json()) as { codes: CodeRow[] };
      setCodes((prev) => [...json.codes, ...prev]);
      setLabel("");
      setNote("");
      setMaxRedemptions("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to generate codes.");
    } finally {
      setGenerating(false);
    }
  }

  async function toggleDisabled(code: string, disabled: boolean) {
    setError(null);
    try {
      const res = await fetch(`/api/admin/beta/codes/${encodeURIComponent(code)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disabled }),
      });
      if (!res.ok) throw new Error(await res.text());
      setCodes((prev) =>
        prev.map((c) => (c.code === code ? { ...c, disabled } : c)),
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update code.");
    }
  }

  async function copyCode(code: string) {
    setError(null);
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      window.setTimeout(() => setCopied((prev) => (prev === code ? null : prev)), 1200);
    } catch {
      setError("Copy failed. Please copy the code manually.");
    }
  }

  return (
    <div className="grid gap-8">
      {error ? <div className="text-sm text-red-400">{error}</div> : null}

      <div className="grid gap-3 rounded-2xl border border-white/10 bg-black/40 p-4">
        <div className="text-sm text-white">Generate codes</div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="text-xs text-white/50">Count</div>
            <Input
              type="number"
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="border-white/10 bg-black/30 text-white"
            />
          </div>
          <div>
            <div className="text-xs text-white/50">Label (optional)</div>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} className="border-white/10 bg-black/30 text-white" />
          </div>
          <div>
            <div className="text-xs text-white/50">Max redemptions (optional)</div>
            <Input
              type="number"
              value={maxRedemptions}
              onChange={(e) => setMaxRedemptions(e.target.value === "" ? "" : Number(e.target.value))}
              className="border-white/10 bg-black/30 text-white"
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="text-xs text-white/50">Note (optional)</div>
            <Input value={note} onChange={(e) => setNote(e.target.value)} className="border-white/10 bg-black/30 text-white" />
          </div>
        </div>
        <Button className="rounded-full" disabled={generating} onClick={() => void generate()}>
          {generating ? "Generating…" : "Generate"}
        </Button>
      </div>

      <div className="grid gap-2">
        <div className="text-sm text-white">Codes</div>
        {codes.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-black/40 p-6 text-sm text-white/60">
            No codes yet.
          </div>
        ) : (
          <div className="grid gap-2">
            {codes.slice(0, 100).map((c) => (
              <div key={c.code} className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-black/40 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="text-sm text-white">
                    <span className="font-mono">{c.code}</span>{" "}
                    {c.disabled ? <span className="text-red-300">(disabled)</span> : null}
                  </div>
                  <div className="text-xs text-white/50">
                    {c.label ? `label: ${c.label} • ` : ""}
                    redeemed: {c.redeemed_count}
                    {c.max_redemptions ? ` / ${c.max_redemptions}` : ""}
                  </div>
                  {c.note ? <div className="mt-1 text-xs text-white/50">{c.note}</div> : null}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full border-white/15 bg-transparent text-white hover:bg-white/5"
                    onClick={() => void copyCode(c.code)}
                  >
                    {copied === c.code ? "Copied" : "Copy"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full border-white/15 bg-transparent text-white hover:bg-white/5"
                    onClick={() => void toggleDisabled(c.code, !c.disabled)}
                  >
                    {c.disabled ? "Enable" : "Disable"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-2">
        <div className="text-sm text-white">Recent redemptions</div>
        {recentRedemptions.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-black/40 p-6 text-sm text-white/60">
            No redemptions yet.
          </div>
        ) : (
          <div className="grid gap-2">
            {recentRedemptions.slice(0, 50).map((r) => (
              <div key={`${r.userId}-${r.redeemedAt}`} className="rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-white/70">
                <div>
                  {r.email || r.userId} redeemed <span className="font-mono">{r.code}</span>
                </div>
                <div className="text-xs text-white/45">{new Date(r.redeemedAt).toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
