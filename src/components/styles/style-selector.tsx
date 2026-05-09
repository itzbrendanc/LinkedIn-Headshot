"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";

import type { StylePreset } from "@/lib/styles/presets";
import { cn } from "@/lib/utils";
import { PLANS } from "@/lib/pricing";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function StyleSelector({
  presets,
  jobId,
  plan,
}: {
  presets: StylePreset[];
  jobId: string;
  plan: string;
}) {
  const router = useRouter();
  const planDef = PLANS.find((p) => p.id === plan) ?? PLANS[1]!;
  const limit = planDef.includedStyles === "all" ? Infinity : planDef.includedStyles;

  const [selected, setSelected] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function toggle(id: string) {
    setSelected((prev) => {
      const has = prev.includes(id);
      if (has) return prev.filter((x) => x !== id);
      if (prev.length >= limit) return prev;
      return [...prev, id];
    });
  }

  async function onCheckout() {
    setError(null);
    if (selected.length === 0) {
      setError("Select at least one style.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/jobs/${encodeURIComponent(jobId)}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedStyles: selected, plan }),
      });
      if (!res.ok) throw new Error(await res.text());
      const json = (await res.json()) as { checkoutUrl?: string; jobId: string };
      if (json.checkoutUrl) {
        window.location.href = json.checkoutUrl;
        return;
      }
      router.push(`/dashboard/job/${encodeURIComponent(json.jobId)}`);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to start generation.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-white/65">
          Selected <span className="text-white">{selected.length}</span> /{" "}
          {planDef.includedStyles === "all" ? "all" : limit} styles
        </div>
        <Button size="lg" className="rounded-full" onClick={() => void onCheckout()} disabled={loading}>
          Continue to checkout
        </Button>
      </div>
      <div className="text-xs text-white/50">
        1 credit = 1 generated headshot. Estimated cost:{" "}
        <span className="text-white">{planDef.images}</span> credits.
      </div>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {presets.map((p) => {
          const isSelected = selected.includes(p.id);
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => toggle(p.id)}
              className={cn("text-left", selected.length >= limit && !isSelected && "opacity-60")}
            >
              <Card className={cn("h-full border-white/10 bg-black/30 transition-colors", isSelected && "ring-1 ring-white/25")}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-white text-base">{p.name}</CardTitle>
                      <CardDescription className="text-white/60">{p.description}</CardDescription>
                    </div>
                    {isSelected ? (
                      <Badge className="border-white/10 bg-white/10 text-white">
                        <Check className="mr-1 h-3.5 w-3.5" /> Selected
                      </Badge>
                    ) : null}
                  </div>
                </CardHeader>
                <CardContent className="grid gap-2 text-sm text-white/65">
                  <div>
                    <span className="text-white/45">Outfit:</span> {p.outfit}
                  </div>
                  <div>
                    <span className="text-white/45">Background:</span> {p.background}
                  </div>
                  <div>
                    <span className="text-white/45">Lighting:</span> {p.lighting}
                  </div>
                </CardContent>
              </Card>
            </button>
          );
        })}
      </div>
      <p className="text-xs text-white/45">
        Styles are prompt templates; the AI provider adapter controls how references and identity are applied.
      </p>
    </div>
  );
}
