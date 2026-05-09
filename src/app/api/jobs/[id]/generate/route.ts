import { NextResponse } from "next/server";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PLANS } from "@/lib/pricing";
import { rateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { requireBetaAccess } from "@/lib/beta-access";

const schema = z.object({
  selectedStyles: z.array(z.string().min(1)).min(1),
  plan: z.string().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return new NextResponse("Unauthorized", { status: 401 });

  const beta = await requireBetaAccess({
    supabase,
    userId: auth.user.id,
    userEmail: auth.user.email,
  });
  if (!beta.ok) return new NextResponse("Private beta access required.", { status: 403 });

  const rl = rateLimit(`job_generate:${auth.user.id}`, { capacity: 10, refillPerSecond: 1 / 5 });
  if (!rl.allowed) return new NextResponse("Too many requests. Try again later.", { status: 429 });

  const body = schema.parse(await request.json());

  const planId = body.plan ?? "pro";
  const planDef = PLANS.find((p) => p.id === planId);
  if (!planDef) return new NextResponse("Invalid plan", { status: 400 });
  if (planDef.includedStyles !== "all" && body.selectedStyles.length > planDef.includedStyles) {
    return new NextResponse(`Too many styles for plan (max ${planDef.includedStyles}).`, { status: 400 });
  }

  const { data: job, error: jobErr } = await supabase
    .from("generation_jobs")
    .select("id,input_image_paths,consent_confirmed,deleted_at")
    .eq("id", id)
    .eq("user_id", auth.user.id)
    .maybeSingle();
  if (jobErr) return new NextResponse(jobErr.message, { status: 400 });
  if (!job) return new NextResponse("Not found", { status: 404 });
  if (job.deleted_at) return new NextResponse("This job was deleted.", { status: 410 });
  const inputPaths = (job.input_image_paths as string[]) ?? [];
  if (inputPaths.length < 10) {
    return new NextResponse("Upload at least 10 valid images before checkout.", { status: 400 });
  }
  if (!(job.consent_confirmed as boolean)) {
    return new NextResponse("Consent is required before checkout.", { status: 400 });
  }

  const { error } = await supabase
    .from("generation_jobs")
    .update({ selected_styles: body.selectedStyles, status: "uploaded" })
    .eq("id", id)
    .eq("user_id", auth.user.id);

  if (error) return new NextResponse(error.message, { status: 400 });
  logger.info("job_styles_selected", { userId: auth.user.id, jobId: id, styles: body.selectedStyles.length });

  const checkoutRes = await fetch(new URL("/api/checkout", request.url), {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie: request.headers.get("cookie") ?? "" },
    body: JSON.stringify({ jobId: id, plan: planId, selectedStyles: body.selectedStyles }),
  });

  if (!checkoutRes.ok) return new NextResponse(await checkoutRes.text(), { status: checkoutRes.status });
  const json = (await checkoutRes.json()) as { checkoutUrl: string | null };
  return NextResponse.json({ jobId: id, checkoutUrl: json.checkoutUrl });
}
