"use client";

import * as React from "react";
import Image from "next/image";
import { Heart, ThumbsDown, ThumbsUp } from "lucide-react";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { GeneratedImageItem } from "@/components/dashboard/generated-image-grid";
import { Badge } from "@/components/ui/badge";

export function ImageDetailModal({
  image,
  children,
}: {
  image: GeneratedImageItem;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [isFavorite, setIsFavorite] = React.useState(() => Boolean(image.isFavorite));
  const [rating, setRating] = React.useState<"up" | "down" | null>(() => image.userRating ?? null);
  const [error, setError] = React.useState<string | null>(null);
  const [regenLoading, setRegenLoading] = React.useState(false);

  // Local state is kept for a premium/instant feel; canonical values live in Supabase.

  async function patchReview(patch: { isFavorite?: boolean; userRating?: "up" | "down" | "none" }) {
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/images/${encodeURIComponent(image.id)}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error(await res.text());
      window.dispatchEvent(
        new CustomEvent("generated-image-updated", {
          detail: { id: image.id, patch },
        }),
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save review.";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  async function regenerate(reason: "similar" | "style") {
    setError(null);
    setRegenLoading(true);
    try {
      // We don't have jobId in this component; it is encoded into the URL path in `image.url` (signed),
      // so we request via a special endpoint on the server.
      const res = await fetch(`/api/images/${encodeURIComponent(image.id)}/regenerate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) throw new Error(await res.text());
      const json = (await res.json()) as { jobId: string };
      window.location.href = `/dashboard/job/${encodeURIComponent(json.jobId)}`;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to regenerate.";
      setError(message);
    } finally {
      setRegenLoading(false);
    }
  }

  return (
    <>
      <div onClick={() => setOpen(true)}>{children}</div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl border-white/10 bg-black/90 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">
              {image.styleName ?? "Headshot"}
            </DialogTitle>
            <DialogDescription className="text-white/60">
              style_id: {image.styleId}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 lg:grid-cols-[0.62fr_0.38fr]">
            <div className="grid gap-3">
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-white/10 bg-black/40">
                <Image src={image.url} alt={image.styleId} fill unoptimized className="object-cover" />
                <div className="absolute left-3 top-3 flex items-center gap-2">
                  <Badge className="border-white/10 bg-black/40 text-white">
                    LinkedIn crop
                  </Badge>
                </div>
              </div>
              <div className="grid gap-2">
                <div className="text-xs text-white/45">LinkedIn crop preview</div>
                <div className="relative aspect-[1/1] overflow-hidden rounded-2xl border border-white/10 bg-black/40">
                  <Image src={image.url} alt="LinkedIn crop preview" fill unoptimized className="object-cover object-top" />
                </div>
              </div>
            </div>

            <div className="grid gap-3">
              <div className="grid gap-2">
                <div className="text-sm text-white/70">Review</div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full border-white/15 bg-transparent text-white hover:bg-white/5"
                    disabled={saving}
                    onClick={() => {
                      const next = rating === "up" ? null : "up";
                      setRating(next);
                      void patchReview({ userRating: next ?? "none" });
                    }}
                  >
                    <ThumbsUp className="h-4 w-4" />{" "}
                    {rating === "up" ? "Liked" : "Thumbs up"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full border-white/15 bg-transparent text-white hover:bg-white/5"
                    disabled={saving}
                    onClick={() => {
                      const next = rating === "down" ? null : "down";
                      setRating(next);
                      void patchReview({ userRating: next ?? "none" });
                    }}
                  >
                    <ThumbsDown className="h-4 w-4" />{" "}
                    {rating === "down" ? "Disliked" : "Thumbs down"}
                  </Button>
                  <Button
                    type="button"
                    className="rounded-full"
                    disabled={saving}
                    onClick={() => {
                      const next = !isFavorite;
                      setIsFavorite(next);
                      void patchReview({ isFavorite: next });
                    }}
                  >
                    <Heart className="h-4 w-4" />{" "}
                    {isFavorite ? "Favorited" : "Favorite"}
                  </Button>
                </div>
              </div>

              <div className="grid gap-2">
                <div className="text-sm text-white/70">Actions</div>
                <div className="flex flex-col gap-2">
                  <Button asChild className="rounded-full">
                    <a href={image.url} download>
                      Download image
                    </a>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full border-white/15 bg-transparent text-white hover:bg-white/5"
                    disabled={regenLoading}
                    onClick={() => void regenerate("similar")}
                  >
                    Regenerate similar
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full border-white/15 bg-transparent text-white hover:bg-white/5"
                    disabled={regenLoading}
                    onClick={() => void regenerate("style")}
                  >
                    Regenerate this style
                  </Button>
                </div>
              </div>

              {error ? <div className="text-sm text-red-400">{error}</div> : null}
              {error && error.toLowerCase().includes("insufficient credits") ? (
                <Button
                  asChild
                  variant="outline"
                  className="rounded-full border-white/15 bg-transparent text-white hover:bg-white/5"
                >
                  <a href="/pricing">Upgrade / buy credits</a>
                </Button>
              ) : null}
              <div className="text-xs text-white/45">
                Regenerations create a new queued job linked to this one. Credits can be deducted later in production.
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
