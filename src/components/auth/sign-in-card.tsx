"use client";

import * as React from "react";
import { Mail } from "lucide-react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function SignInCard({
  nextPath = "/dashboard",
}: {
  nextPath?: string;
}) {
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo },
      });
      if (signInError) throw signInError;
      setSent(true);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to send sign-in link.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-white/10 bg-black/30">
      <CardHeader>
        <CardTitle className="text-white">Sign in to continue</CardTitle>
        <CardDescription className="text-white/60">
          We’ll email you a secure sign-in link.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid gap-3">
          <div className="grid gap-2">
            <Input
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="border-white/10 bg-black/20 text-white placeholder:text-white/40"
            />
          </div>
          <Button
            type="submit"
            size="lg"
            className="rounded-full"
            disabled={loading || !email}
          >
            <Mail className="h-4 w-4" />
            {sent ? "Link sent — check your inbox" : "Email me a sign-in link"}
          </Button>
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          <p className="text-xs text-white/50">
            By continuing you agree to our Terms and Privacy Policy.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
