"use client";

import Image from "next/image";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ImageDetailModal } from "@/components/dashboard/image-detail-modal";

export type GeneratedImageItem = {
  id: string;
  styleId: string;
  styleName?: string;
  url: string;
  userRating?: "up" | "down" | null;
  isFavorite?: boolean;
};

export function GeneratedImageGrid({ images }: { images: GeneratedImageItem[] }) {
  if (images.length === 0) {
    return (
      <Card className="border-white/10 bg-black/30 p-6 text-sm text-white/60">
        No images yet.
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {images.map((img) => (
        <Card key={img.id} className="overflow-hidden border-white/10 bg-black/30">
          <ImageDetailModal image={img}>
            <button type="button" className="relative aspect-[4/5] w-full">
            <Image
              src={img.url}
              alt={img.styleId}
              fill
              unoptimized
              className="object-cover"
            />
            <div className="absolute left-3 top-3 flex items-center gap-2">
              <Badge className="border-white/10 bg-black/40 text-white">
                LinkedIn crop
              </Badge>
            </div>
            </button>
          </ImageDetailModal>
          <div className="flex items-center justify-between gap-3 p-3">
            <div className="min-w-0">
              <div className="truncate text-xs text-white">
                {img.styleName ?? img.styleId}
              </div>
              <div className="truncate text-[11px] text-white/45">
                style_id: {img.styleId}
              </div>
            </div>
            <Button asChild size="sm" className="rounded-full">
              <a href={img.url} download>
                Download
              </a>
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
