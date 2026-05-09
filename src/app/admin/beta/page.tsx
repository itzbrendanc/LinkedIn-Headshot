import Link from "next/link";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/admin-auth";
import { Container } from "@/components/site/container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminBetaClient } from "@/components/admin/admin-beta-client";
import { AdminNav } from "@/components/admin/admin-nav";
import { Button } from "@/components/ui/button";

type CodeRow = {
  code: string;
  label?: string | null;
  note?: string | null;
  max_redemptions?: number | null;
  disabled: boolean;
  created_at: string;
  redeemed_count: number;
};

export default async function AdminBetaPage() {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/dashboard");
  if (!isAdminEmail(auth.user.email)) redirect("/dashboard");

  const admin = createSupabaseAdminClient();
  const { data: codes } = await admin
    .from("beta_access_codes")
    .select("code,label,note,max_redemptions,disabled,created_at")
    .order("created_at", { ascending: false })
    .limit(500);

  const rows: CodeRow[] = [];
  for (const c of codes ?? []) {
    const { count } = await admin
      .from("beta_access_redemptions")
      .select("id", { count: "exact", head: true })
      .eq("redeemed_code", c.code as string);
    rows.push({
      code: c.code as string,
      label: (c.label as string | null) ?? null,
      note: (c.note as string | null) ?? null,
      max_redemptions: (c.max_redemptions as number | null) ?? null,
      disabled: Boolean(c.disabled),
      created_at: c.created_at as string,
      redeemed_count: count ?? 0,
    });
  }

  // Redemptions list
  const { data: redemptions } = await admin
    .from("beta_access_redemptions")
    .select("user_id,code,redeemed_at")
    .order("redeemed_at", { ascending: false })
    .limit(200);

  const userIds = Array.from(new Set((redemptions ?? []).map((r) => r.user_id as string)));
  const emailsByUserId = new Map<string, string>();
  if (userIds.length) {
    const { data: users } = await admin.from("users").select("id,email").in("id", userIds);
    for (const u of users ?? []) emailsByUserId.set(u.id as string, (u.email as string) ?? "");
  }

  return (
    <main className="bg-black">
      <Container className="py-10 sm:py-14">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Admin Beta Invites</h1>
            <p className="mt-2 text-white/65">Generate and manage private beta access codes.</p>
          </div>
          <Button asChild className="rounded-full" variant="outline">
            <Link href="/dashboard">Back</Link>
          </Button>
        </div>
        <div className="mt-4">
          <AdminNav />
        </div>

        <div className="mt-10 grid gap-4">
          <Card className="border-white/10 bg-black/30">
            <CardHeader>
              <CardTitle className="text-white">Access codes</CardTitle>
              <CardDescription className="text-white/60">
                Codes can be disabled and optionally limited by max redemptions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AdminBetaClient
                initialCodes={rows}
                recentRedemptions={(redemptions ?? []).map((r) => ({
                  userId: r.user_id as string,
                  email: emailsByUserId.get(r.user_id as string) ?? "",
                  code: r.code as string,
                  redeemedAt: r.redeemed_at as string,
                }))}
              />
            </CardContent>
          </Card>
        </div>
      </Container>
    </main>
  );
}
