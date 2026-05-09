"use client";

import * as React from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function SettingsClient() {
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  async function call(path: string) {
    setMessage(null);
    setBusy(true);
    try {
      const res = await fetch(path, { method: "POST" });
      if (!res.ok) throw new Error(await res.text());
      setMessage("Done.");
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="border-white/10 bg-black/30">
      <CardHeader>
        <CardTitle className="text-white">Delete my data</CardTitle>
        <CardDescription className="text-white/60">
          Permanently delete uploads, generated images, jobs, billing records, and your account.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="text-sm text-white/65">
          This action is destructive and cannot be undone.
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="rounded-full border-red-500/40 bg-transparent text-red-200 hover:bg-red-500/10"
              disabled={busy}
            >
              Delete all my data
            </Button>
          </DialogTrigger>
          <DialogContent className="border-white/10 bg-black/90 text-white">
            <DialogHeader>
              <DialogTitle>Confirm deletion</DialogTitle>
              <DialogDescription className="text-white/60">
                This will permanently delete your account and all associated data.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                className="rounded-full"
                disabled={busy}
                onClick={() => void call("/api/me/delete")}
              >
                Yes, delete everything
              </Button>
            </div>
            {message ? <div className="text-sm text-white/70">{message}</div> : null}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

