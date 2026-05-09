import Link from "next/link";
import { redirect } from "next/navigation";

import { BetaWall } from "@/components/beta/beta-wall";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Container } from "@/components/site/container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PLANS } from "@/lib/pricing";

export default async function BillingPage() {
  return (
    <BetaWall nextPath="/dashboard/billing">
      <BillingInner />
    </BetaWall>
  );
}

async function BillingInner() {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/dashboard");

  const { data: credits } = await supabase
    .from("user_credits")
    .select("balance,lifetime_purchased,lifetime_used")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  const { data: orders } = await supabase
    .from("orders")
    .select("id,plan_id,amount_cents,currency,status,created_at,credits_granted,credits_used,credits_refunded")
    .order("created_at", { ascending: false })
    .limit(50);

  const balance = (credits?.balance as number | null) ?? 0;

  return (
    <main className="bg-black">
      <Container className="py-10 sm:py-14">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Billing</h1>
            <p className="mt-2 text-white/65">
              1 credit = 1 generated headshot.
            </p>
          </div>
          <Button asChild className="rounded-full">
            <Link href="/pricing">Buy more credits</Link>
          </Button>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          <Card className="border-white/10 bg-black/30">
            <CardHeader>
              <CardTitle className="text-white">Credits remaining</CardTitle>
              <CardDescription className="text-white/60">
                Available for generation and regenerations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-semibold tracking-tight">{balance}</div>
              <div className="mt-3 text-sm text-white/60">
                Lifetime purchased: {(credits?.lifetime_purchased as number | null) ?? 0} • Lifetime used: {(credits?.lifetime_used as number | null) ?? 0}
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-black/30 lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-white">Plan comparison</CardTitle>
              <CardDescription className="text-white/60">
                Credits are granted per purchase. Styles are enforced server-side.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3">
              {PLANS.map((p) => (
                <div key={p.id} className="rounded-2xl border border-white/10 bg-black/40 p-4">
                  <div className="text-sm font-semibold">{p.name}</div>
                  <div className="mt-2 text-xs text-white/55">
                    {p.images} credits •{" "}
                    {p.includedStyles === "all" ? "All styles" : `${p.includedStyles} styles`}
                  </div>
                  <div className="mt-4 text-sm text-white/70">${p.priceUsd}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="mt-10">
          <Card className="border-white/10 bg-black/30">
            <CardHeader>
              <CardTitle className="text-white">Purchase history</CardTitle>
              <CardDescription className="text-white/60">
                Orders and credit usage.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {orders && orders.length > 0 ? (
                orders.map((o) => (
                  <div
                    key={o.id}
                    className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-black/40 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="text-sm text-white">
                        {o.plan_id} • {(o.status as string) ?? "—"}
                      </div>
                      <div className="text-xs text-white/50">
                        {new Date(o.created_at as string).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-xs text-white/60">
                      Granted: {(o.credits_granted as number) ?? 0} • Used: {(o.credits_used as number) ?? 0} • Refunded: {(o.credits_refunded as number) ?? 0}
                    </div>
                    <div className="text-sm text-white/70">
                      ${(Number(o.amount_cents) / 100).toFixed(0)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-white/10 bg-black/40 p-6 text-sm text-white/60">
                  No purchases yet. Choose a plan on the pricing page to buy credits.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </Container>
    </main>
  );
}
