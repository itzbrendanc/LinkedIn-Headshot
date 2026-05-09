import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/admin-auth";
import { logger } from "@/lib/logger";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return new NextResponse("Unauthorized", { status: 401 });
  if (!isAdminEmail(auth.user.email)) return new NextResponse("Forbidden", { status: 403 });

  const admin = createSupabaseAdminClient();
  const { data: job } = await admin.from("generation_jobs").select("status,deleted_at").eq("id", id).maybeSingle();
  if (!job) return new NextResponse("Not found", { status: 404 });
  if (job.deleted_at) return new NextResponse("Job deleted.", { status: 410 });
  if ((job.status as string) !== "failed") {
    return new NextResponse("Only failed jobs can be retried.", { status: 409 });
  }

  await admin.from("generation_jobs").update({ status: "queued", error_message: null }).eq("id", id);
  logger.warn("admin_retry_job", { adminEmail: auth.user.email, jobId: id });
  return NextResponse.json({ ok: true });
}
