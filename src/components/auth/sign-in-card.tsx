"use client";

import * as React from "react";
import { Mail } from "lucide-react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getClientEnv } from "@/lib/env";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function SignInCard({
  nextPath = "/dashboard",
}: {
  nextPath?: string;
}) {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const [tab, setTab] = React.useState<"magic" | "signin" | "signup">("magic");
  const [error, setError] = React.useState<string | null>(null);

  function friendlyError(message: string) {
    if (message.toLowerCase().includes("invalid login credentials")) {
      return "Invalid email or password.";
    }
    if (message.toLowerCase().includes("password should be at least")) {
      return "Password is too short.";
    }
    if (message.toLowerCase().includes("user already registered")) {
      return "An account with this email already exists. Try signing in instead.";
    }
    return message;
  }

  async function sendMagicLink() {
    const supabase = createSupabaseBrowserClient();
    const env = getClientEnv();
    const siteUrl = env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;
    const redirectTo = `${siteUrl}/auth/callback?next=${encodeURIComponent(nextPath)}`;
    const { error: signInError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });
    if (signInError) throw signInError;
    setSent(true);
  }

  async function signInWithPassword() {
    const supabase = createSupabaseBrowserClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError) throw signInError;
    window.location.assign(nextPath);
  }

  async function signUpWithPassword() {
    const supabase = createSupabaseBrowserClient();
    const env = getClientEnv();
    const siteUrl = env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;
    const emailRedirectTo = `${siteUrl}/auth/callback?next=${encodeURIComponent(nextPath)}`;
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo },
    });
    if (signUpError) throw signUpError;
    // If email confirmations are disabled, session will be present and user is signed in immediately.
    if (data.session) {
      window.location.assign(nextPath);
      return;
    }
    setSent(true);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (tab === "magic") {
        await sendMagicLink();
      } else if (tab === "signin") {
        await signInWithPassword();
      } else {
        await signUpWithPassword();
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to send sign-in link.";
      setError(friendlyError(message));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-white/10 bg-black/30">
      <CardHeader>
        <CardTitle className="text-white">Sign in to continue</CardTitle>
        <CardDescription className="text-white/60">
          Use a magic link or email + password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="grid gap-4">
          <TabsList className="grid w-full grid-cols-3 bg-black/30">
            <TabsTrigger value="magic">Magic link</TabsTrigger>
            <TabsTrigger value="signin">Password</TabsTrigger>
            <TabsTrigger value="signup">Sign up</TabsTrigger>
          </TabsList>

          <form onSubmit={onSubmit} className="grid gap-3">
            <div className="grid gap-2">
              <Input
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="border-white/10 bg-black/20 text-white placeholder:text-white/40"
              />
            </div>

            <TabsContent value="magic" className="m-0 grid gap-3">
              <Button
                type="submit"
                size="lg"
                className="rounded-full"
                disabled={loading || !email}
              >
                <Mail className="h-4 w-4" />
                {sent ? "Link sent — check your inbox" : "Email me a sign-in link"}
              </Button>
              <p className="text-xs text-white/50">
                We’ll email you a secure sign-in link.
              </p>
            </TabsContent>

            <TabsContent value="signin" className="m-0 grid gap-3">
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="border-white/10 bg-black/20 text-white placeholder:text-white/40"
              />
              <Button
                type="submit"
                size="lg"
                className="rounded-full"
                disabled={loading || !email || password.length < 1}
              >
                {loading ? "Signing in…" : "Sign in"}
              </Button>
            </TabsContent>

            <TabsContent value="signup" className="m-0 grid gap-3">
              <Input
                type="password"
                placeholder="Password (min 8 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className="border-white/10 bg-black/20 text-white placeholder:text-white/40"
              />
              <Button
                type="submit"
                size="lg"
                className="rounded-full"
                disabled={loading || !email || password.length < 8}
              >
                {loading ? "Creating account…" : "Create account"}
              </Button>
              {sent ? (
                <p className="text-xs text-white/50">
                  Account created. If email confirmation is enabled, check your inbox to confirm.
                </p>
              ) : (
                <p className="text-xs text-white/50">
                  If email confirmation is enabled in Supabase, you’ll need to confirm via email.
                </p>
              )}
            </TabsContent>

            {error ? <p className="text-sm text-red-400">{error}</p> : null}
            <p className="text-xs text-white/50">
              By continuing you agree to our Terms and Privacy Policy.
            </p>
          </form>
        </Tabs>
      </CardContent>
    </Card>
  );
}
