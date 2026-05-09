"use client";

import * as React from "react";
import { Upload } from "lucide-react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

type Uploaded = {
  name: string;
  storagePath: string;
};

export function UploadDropzone({
  min = 10,
  max = 20,
  onComplete,
}: {
  min?: number;
  max?: number;
  onComplete: (inputImagePaths: string[]) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [dragActive, setDragActive] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [uploaded, setUploaded] = React.useState<Uploaded[]>([]);

  const doneCount = uploaded.length;

  async function uploadFiles(files: File[]) {
    setError(null);
    const onlyImages = files.filter((f) => f.type.startsWith("image/"));
    if (onlyImages.length !== files.length) {
      setError("Only image files are allowed.");
      return;
    }
    const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);
    for (const f of onlyImages) {
      if (!allowed.has(f.type)) {
        setError("Only JPEG, PNG, and WebP images are supported.");
        return;
      }
      const maxBytes = 10 * 1024 * 1024;
      if (f.size > maxBytes) {
        setError("Each image must be 10MB or less.");
        return;
      }
    }
    if (doneCount + onlyImages.length > max) {
      setError(`Please upload at most ${max} images total.`);
      return;
    }

    setUploading(true);
    setProgress(0);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      const userId = authData.user?.id;
      if (!userId) throw new Error("Please sign in to upload photos.");

      const uploadedNext: Uploaded[] = [];
      for (let i = 0; i < onlyImages.length; i++) {
        const file = onlyImages[i]!;
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${userId}/${crypto.randomUUID()}.${ext}`;

        const { error: upErr } = await supabase.storage
          .from("uploads")
          .upload(path, file, { cacheControl: "3600", upsert: false });
        if (upErr) {
          const msg = String(upErr.message || "");
          if (msg.toLowerCase().includes("bucket") && msg.toLowerCase().includes("not")) {
            throw new Error(
              "Upload bucket missing. Create a private Supabase Storage bucket named 'uploads' and try again.",
            );
          }
          throw upErr;
        }

        const { error: insertErr } = await supabase.from("photo_uploads").insert({
          user_id: userId,
          storage_bucket: "uploads",
          storage_path: path,
          mime_type: file.type,
          bytes: file.size,
        });
        if (insertErr) throw insertErr;

        uploadedNext.push({ name: file.name, storagePath: path });
        const pct = Math.round(((i + 1) / onlyImages.length) * 100);
        setProgress(pct);
      }

      setUploaded((prev) => [...prev, ...uploadedNext]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Upload failed.";
      setError(message);
    } finally {
      setUploading(false);
    }
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files || []);
    void uploadFiles(files);
  }

  function onBrowse() {
    inputRef.current?.click();
  }

  const canContinue = doneCount >= min && doneCount <= max && !uploading;

  return (
    <div className="grid gap-4">
      <div
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragActive(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragActive(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragActive(false);
        }}
        onDrop={onDrop}
        className={cn(
          "rounded-3xl border border-dashed p-10 transition-colors",
          dragActive ? "border-white/30 bg-white/5" : "border-white/10 bg-black/30",
        )}
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
            <Upload className="h-5 w-5 text-white/80" />
          </div>
          <div className="text-lg font-semibold">Upload 10–20 close-up photos</div>
          <div className="max-w-md text-sm text-white/60">
            Drag and drop your images, or browse files. Keep your face visible and
            vary angles for best identity preservation.
          </div>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="rounded-full border-white/15 bg-transparent text-white hover:bg-white/5"
              onClick={onBrowse}
              disabled={uploading}
            >
              Browse files
            </Button>
          </div>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              e.currentTarget.value = "";
              void uploadFiles(files);
            }}
          />
        </div>
      </div>

      {uploading ? (
        <div className="grid gap-2">
          <div className="flex items-center justify-between text-xs text-white/60">
            <span>Uploading…</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} />
        </div>
      ) : null}

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      <div className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-black/30 p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-white/70">
            Uploaded: <span className="text-white">{doneCount}</span> / {max}
          </div>
          <Button
            type="button"
            size="sm"
            className="rounded-full"
            disabled={!canContinue}
            onClick={() => onComplete(uploaded.map((u) => u.storagePath))}
          >
            Continue
          </Button>
        </div>
        {doneCount > 0 ? (
          <div className="grid gap-1 text-xs text-white/50">
            {uploaded.slice(-5).map((u) => (
              <div key={u.storagePath} className="truncate">
                {u.name}
              </div>
            ))}
            {doneCount > 5 ? <div>…</div> : null}
          </div>
        ) : null}
        <div className="text-xs text-white/45">
          Tip: upload at least {min}. More angles improves consistency.
        </div>
      </div>
    </div>
  );
}
