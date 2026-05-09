import { NextResponse } from "next/server";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getServerEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { rateLimit } from "@/lib/rate-limit";
import { requireBetaAccess } from "@/lib/beta-access";

const schema = z.object({
  reason: z.enum(["similar", "style"]),
  styleId: z.string().min(1),
  imageId: z.string().uuid().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: parentJobId } = await params;
  const body = schema.parse(await request.json());

  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return new NextResponse("Unauthorized", { status: 401 });

  const beta = await requireBetaAccess({
    supabase,
    userId: auth.user.id,
    userEmail: auth.user.email,
  });
  if (!beta.ok) return new NextResponse("Private beta access required.", { status: 403 });

  const rl = rateLimit(`regen:${auth.user.id}`, { capacity: 12, refillPerSecond: 1 / 10 });
  if (!rl.allowed) return new NextResponse("Too many requests. Try again later.", { status: 429 });

  const { data: parentJob, error: parentErr } = await supabase
    .from("generation_jobs")
    .select("id,input_image_paths,provider,consent_confirmed,consent_text,consent_confirmed_at")
    .eq("id", parentJobId)
    .eq("user_id", auth.user.id)
    .is("deleted_at", null)
    .maybeSingle();
  if (parentErr) return new NextResponse(parentErr.message, { status: 400 });
  if (!parentJob) return new NextResponse("Not found", { status: 404 });

  const inputPaths = (parentJob.input_image_paths as string[]) ?? [];
  if (inputPaths.length < 10) {
    return new NextResponse("Not enough input images to regenerate.", { status: 400 });
  }
  if (!parentJob.consent_confirmed) {
    return new NextResponse("Consent is required to regenerate.", { status: 400 });
  }

  const env = getServerEnv();
  const provider = (parentJob.provider as string) ?? (env.AI_PROVIDER ?? "mock");
  const billingEnabled = Boolean(env.STRIPE_SECRET_KEY) && provider !== "mock";

  // Default regeneration size: 20 (basic-sized).
  const requestedImages = 20;

  if (billingEnabled && requestedImages > 0) {
    const { data: creditsRow, error: creditsErr } = await supabase
      .from("user_credits")
      .select("balance")
      .eq("user_id", auth.user.id)
      .maybeSingle();
    if (creditsErr) return new NextResponse(creditsErr.message, { status: 400 });
    const balance = (creditsRow?.balance as number | null) ?? 0;
    if (balance < requestedImages) {
      return new NextResponse(
        `Insufficient credits. Need ${requestedImages}, have ${balance}.`,
        { status: 402 },
      );
    }
  }

  const regenerationReason =
    body.reason === "similar"
      ? `similar:${body.styleId}${body.imageId ? `:${body.imageId}` : ""}`
      : `style:${body.styleId}`;

  const { data: job, error } = await supabase
    .from("generation_jobs")
    .insert({
      user_id: auth.user.id,
      status: "queued",
      selected_styles: [body.styleId],
      input_image_paths: inputPaths,
      output_image_paths: [],
      provider,
      parent_job_id: parentJobId,
      regeneration_reason: regenerationReason,
      consent_confirmed: Boolean(parentJob.consent_confirmed),
      consent_text: (parentJob.consent_text as string | null) ?? null,
      consent_confirmed_at: (parentJob.consent_confirmed_at as string | null) ?? null,
      requested_images: requestedImages,
    })
    .select("id")
    .single();

  if (error) return new NextResponse(error.message, { status: 400 });
  logger.info("job_regen_created", {
    userId: auth.user.id,
    parentJobId,
    jobId: job.id,
    reason: regenerationReason,
  });
  return NextResponse.json({ jobId: job.id });
}
