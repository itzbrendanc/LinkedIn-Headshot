import { redirect } from "next/navigation";

import { Container } from "@/components/site/container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin-auth";
import { AdminNav } from "@/components/admin/admin-nav";
import { AdminLaunchChecklistClient } from "@/components/admin/admin-launch-checklist-client";

export default async function AdminLaunchChecklistPage() {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/dashboard");
  if (!isAdminEmail(auth.user.email)) redirect("/dashboard");

  return (
    <main className="bg-black">
      <Container className="py-10 sm:py-14">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">Launch checklist</h1>
          <p className="text-white/65">
            Private beta pre-flight list. Manual checkboxes — no automation.
          </p>
        </div>

        <div className="mt-4">
          <AdminNav />
        </div>

        <div className="mt-10">
          <Card className="border-white/10 bg-black/30">
            <CardHeader>
              <CardTitle className="text-white">Pre-flight</CardTitle>
              <CardDescription className="text-white/60">
                Confirm the basics before inviting users.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AdminLaunchChecklistClient />
            </CardContent>
          </Card>
        </div>
      </Container>
    </main>
  );
}

