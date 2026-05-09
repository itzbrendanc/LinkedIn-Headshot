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
  const { data: job } = await admin
    .from("generation_jobs")
    .select("id,user_id,credits_charged,order_id")
    .eq("id", id)
    .maybeSingle();
  if (!job) return new NextResponse("Not found", { status: 404 });

  const creditsCharged = (job.credits_charged as number | null) ?? 0;
  if (creditsCharged <= 0) return new NextResponse("No credits to refund.", { status: 400 });

  // Prevent double-refund: require no existing refund transaction for this job.
  const { count } = await admin
    .from("credit_transactions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", job.user_id as string)
    .eq("reason", `admin_job_refund:${id}`);
  if ((count ?? 0) > 0) return new NextResponse("Already refunded.", { status: 409 });

  const { data: credits } = await admin
    .from("user_credits")
    .select("balance")
    .eq("user_id", job.user_id as string)
    .maybeSingle();
  const balance = (credits?.balance as number | null) ?? 0;
  await admin
    .from("user_credits")
    .update({ balance: balance + creditsCharged, updated_at: new Date().toISOString() })
    .eq("user_id", job.user_id as string);

  await admin.from("credit_transactions").insert({
    user_id: job.user_id as string,
    order_id: (job.order_id as string | null) ?? null,
    delta: creditsCharged,
    reason: `admin_job_refund:${id}`,
  });

  await admin.from("generation_jobs").update({ credits_charged: 0 }).eq("id", id);

  logger.warn("admin_job_refund", { adminEmail: auth.user.email, jobId: id, credits: creditsCharged });
  return NextResponse.json({ ok: true });
}

