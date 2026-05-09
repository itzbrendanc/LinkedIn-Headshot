"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";

export function DownloadButton({
  href,
  filename,
  variant = "outline",
}: {
  href: string;
  filename: string;
  variant?: "default" | "secondary" | "outline" | "ghost";
}) {
  const [loading, setLoading] = React.useState(false);

  async function download() {
    setLoading(true);
    try {
      const res = await fetch(href);
      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      className="rounded-full"
      disabled={loading}
      onClick={() => void download()}
    >
      {loading ? "Preparing…" : "Download ZIP"}
    </Button>
  );
}

