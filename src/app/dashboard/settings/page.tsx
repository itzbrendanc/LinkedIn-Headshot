import { redirect } from "next/navigation";

import { BetaWall } from "@/components/beta/beta-wall";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Container } from "@/components/site/container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SettingsClient } from "@/components/settings/settings-client";

export default async function SettingsPage() {
  return (
    <BetaWall nextPath="/dashboard/settings">
      <SettingsInner />
    </BetaWall>
  );
}

async function SettingsInner() {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/dashboard");

  return (
    <main className="bg-black">
      <Container className="py-10 sm:py-14">
        <div className="max-w-3xl">
          <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
          <p className="mt-2 text-white/65">
            Privacy controls and data deletion.
          </p>
        </div>

        <div className="mt-10 grid gap-4">
          <Card className="border-white/10 bg-black/30">
            <CardHeader>
              <CardTitle className="text-white">Account</CardTitle>
              <CardDescription className="text-white/60">
                Signed in as {auth.user.email}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-white/65">
              Your uploads and results are private to your account by default.
            </CardContent>
          </Card>

          <SettingsClient />
        </div>
      </Container>
    </main>
  );
}
