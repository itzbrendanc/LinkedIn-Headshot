"use client";

import * as React from "react";
import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GeneratedImageGrid, type GeneratedImageItem } from "@/components/dashboard/generated-image-grid";

export function JobGallery({
  jobId,
  jobStatus,
  errorMessage,
}: {
  jobId: string;
  jobStatus: string;
  errorMessage: string | null;
}) {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [images, setImages] = React.useState<GeneratedImageItem[]>([]);
  const [styleOptions, setStyleOptions] = React.useState<Array<{ id: string; name: string }>>([]);
  const [styleFilter, setStyleFilter] = React.useState<string>("all");
  const [regenLoading, setRegenLoading] = React.useState(false);

  const refresh = React.useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/jobs/${encodeURIComponent(jobId)}/images`, { cache: "no-store" });
      if (!res.ok) throw new Error(await res.text());
      const json = (await res.json()) as { images: GeneratedImageItem[]; styles: Array<{ id: string; name: string }> };
      setImages(json.images);
      setStyleOptions(json.styles);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load images.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  React.useEffect(() => {
    queueMicrotask(() => {
      void refresh();
    });
  }, [refresh]);

  React.useEffect(() => {
    function onUpdate(e: Event) {
      const ce = e as CustomEvent<{ id: string; patch: { isFavorite?: boolean; userRating?: "up" | "down" | "none" } }>;
      const { id, patch } = ce.detail ?? { id: "", patch: {} };
      if (!id) return;
      setImages((prev) => {
        const next = prev.map((img) => {
          if (img.id !== id) return img;
          const updated = { ...img };
          if (typeof patch.isFavorite === "boolean") updated.isFavorite = patch.isFavorite;
          if (patch.userRating) updated.userRating = patch.userRating === "none" ? null : patch.userRating;
          return updated;
        });
        // Keep favorites sorted first (simple stable resort).
        return [...next].sort((a, b) => Number(Boolean(b.isFavorite)) - Number(Boolean(a.isFavorite)));
      });
    }
    window.addEventListener("generated-image-updated", onUpdate);
    return () => window.removeEventListener("generated-image-updated", onUpdate);
  }, []);

  const filtered = images.filter((i) => (styleFilter === "all" ? true : i.styleId === styleFilter));
  const favorites = filtered.filter((i) => i.isFavorite);

  async function regenerateStyle(styleId: string) {
    setError(null);
    setRegenLoading(true);
    try {
      const res = await fetch(`/api/jobs/${encodeURIComponent(jobId)}/regenerate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "style", styleId }),
      });
      if (!res.ok) throw new Error(await res.text());
      const json = (await res.json()) as { jobId: string };
      window.location.href = `/dashboard/job/${encodeURIComponent(json.jobId)}`;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to regenerate style.";
      setError(message);
    } finally {
      setRegenLoading(false);
    }
  }

  return (
    <Card className="border-white/10 bg-black/30">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-white">Headshots</CardTitle>
            <CardDescription className="text-white/60">
              Rate and favorite your best results. Regenerate styles for more options.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-full border-white/15 bg-transparent text-white hover:bg-white/5"
              onClick={() => void refresh()}
            >
              Refresh
            </Button>
            <Button asChild className="rounded-full">
              <Link href={`/styles?job=${encodeURIComponent(jobId)}&plan=pro`}>Add styles</Link>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-6">
        {jobStatus === "failed" ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
            <div className="font-semibold text-red-100">Generation failed</div>
            <div className="mt-1 text-red-100/80">
              {errorMessage || "Something went wrong while generating images."}
            </div>
            <div className="mt-2 text-xs text-red-100/70">
              Need help?{" "}
              <a className="underline underline-offset-4" href="/dashboard/settings">
                Contact support
              </a>
              .
            </div>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Button asChild className="rounded-full">
                <Link href={`/styles?job=${encodeURIComponent(jobId)}&plan=pro`}>Try again</Link>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="rounded-full border-white/15 bg-transparent text-white hover:bg-white/5"
                onClick={() => void refresh()}
              >
                Refresh status
              </Button>
            </div>
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-white/70">
            <div>{error}</div>
            {error.toLowerCase().includes("insufficient credits") ? (
              <div className="mt-3">
                <Button asChild className="rounded-full">
                  <Link href="/pricing">Upgrade / buy credits</Link>
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-white/65">
            <span>By style:</span>
            <select
              className="h-10 rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-white"
              value={styleFilter}
              onChange={(e) => setStyleFilter(e.target.value)}
            >
              <option value="all">All</option>
              {styleOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            {styleFilter !== "all" ? (
              <Button
                type="button"
                size="sm"
                className="rounded-full"
                disabled={regenLoading}
                onClick={() => void regenerateStyle(styleFilter)}
              >
                Regenerate this style
              </Button>
            ) : null}
          </div>
          <div className="text-xs text-white/45">
            {loading ? "Loading…" : `${filtered.length} image(s)`}
          </div>
        </div>

        <Tabs defaultValue="all">
          <TabsList className="bg-white/5">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="favorites">Favorites</TabsTrigger>
          </TabsList>
          <TabsContent value="all">
            {loading ? (
              <div className="rounded-2xl border border-white/10 bg-black/40 p-6 text-sm text-white/60">
                Loading your gallery…
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState jobStatus={jobStatus} />
            ) : (
              <GeneratedImageGrid images={filtered} />
            )}
          </TabsContent>
          <TabsContent value="favorites">
            {loading ? (
              <div className="rounded-2xl border border-white/10 bg-black/40 p-6 text-sm text-white/60">
                Loading favorites…
              </div>
            ) : favorites.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-black/40 p-6 text-sm text-white/60">
                No favorites yet. Open an image and tap the heart to favorite it.
              </div>
            ) : (
              <GeneratedImageGrid images={favorites} />
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function EmptyState({ jobStatus }: { jobStatus: string }) {
  if (jobStatus === "queued" || jobStatus === "training" || jobStatus === "generating" || jobStatus === "enhancing") {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/40 p-6 text-sm text-white/60">
        Your job is processing. Most jobs complete within minutes. This page will update as results arrive.
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 p-6 text-sm text-white/60">
      No images yet. If you’re in demo mode, run <span className="font-mono">npm run worker:once</span>.
    </div>
  );
}
