import Link from "next/link";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { Container } from "@/components/site/container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AdminJobsClient } from "@/components/admin/admin-jobs-client";
import { AdminNav } from "@/components/admin/admin-nav";
import { isAdminEmail } from "@/lib/admin-auth";

type AdminJobRow = {
  id: string;
  user_id: string;
  status: string;
  provider: string;
  error_message?: string | null;
  created_at: string;
  is_abusive?: boolean | null;
};

export default async function AdminJobsPage({
  searchParams,
}: {
  searchParams?: { user?: string };
}) {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/dashboard");

  if (!isAdminEmail(auth.user.email)) {
    redirect("/dashboard");
  }

  const admin = createSupabaseAdminClient();
  const userFilter = typeof searchParams?.user === "string" ? searchParams.user : null;
  const jobsQuery = admin
    .from("generation_jobs")
    .select("id,user_id,status,provider,error_message,created_at,deleted_at,is_abusive")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(50);

  const { data: jobs } = userFilter ? await jobsQuery.eq("user_id", userFilter) : await jobsQuery;

  return (
    <main className="bg-black">
      <Container className="py-10 sm:py-14">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Admin Jobs</h1>
            <p className="mt-2 text-white/65">
              Internal safety review dashboard (MVP).
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <AdminNav />
          <Button asChild className="rounded-full" variant="outline">
            <Link href="/dashboard">Back</Link>
          </Button>
        </div>

        <div className="mt-10">
          <Card className="border-white/10 bg-black/30">
            <CardHeader>
              <CardTitle className="text-white">Recent jobs</CardTitle>
              <CardDescription className="text-white/60">
                Includes failed jobs. Admin can delete abusive jobs.
                {userFilter ? <span className="ml-2">(filtered)</span> : null}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AdminJobsClient initialJobs={(jobs ?? []) as unknown as AdminJobRow[]} />
            </CardContent>
          </Card>
        </div>
      </Container>
    </main>
  );
}
