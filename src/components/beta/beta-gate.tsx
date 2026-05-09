"use client";

import * as React from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function BetaGate({
  title = "Private beta access",
  description = "Enter your access code to continue.",
  supportEmail,
}: {
  title?: string;
  description?: string;
  supportEmail?: string;
}) {
  const [code, setCode] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [ok, setOk] = React.useState(false);

  async function redeem() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/beta/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (!res.ok) throw new Error(await res.text());
      setOk(true);
      window.location.reload();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid code.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-white/10 bg-gradient-to-b from-white/10 to-black/30">
      <CardHeader>
        <CardTitle className="text-white">{title}</CardTitle>
        <CardDescription className="text-white/60">{description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        <div className="text-sm text-white/65">
          Private beta access keeps generation quality high while we review results manually.
        </div>
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Access code"
          className="border-white/10 bg-black/20 text-white placeholder:text-white/40"
        />
        <Button className="rounded-full" disabled={loading || !code} onClick={() => void redeem()}>
          {ok ? "Unlocked" : loading ? "Checking…" : "Continue"}
        </Button>
        {error ? <div className="text-sm text-red-400">{error}</div> : null}
        {supportEmail ? (
          <div className="text-xs text-white/45">
            Need an invite? Email{" "}
            <a className="underline underline-offset-4" href={`mailto:${supportEmail}`}>
              {supportEmail}
            </a>
            .
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
