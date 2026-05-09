import { NextResponse } from "next/server";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getServerEnv } from "@/lib/env";
import { PLANS } from "@/lib/pricing";
import { rateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { requireBetaAccess } from "@/lib/beta-access";

const schema = z.object({
  inputImagePaths: z.array(z.string().min(1)).min(10).max(20),
  plan: z.string().optional(),
  consentConfirmed: z.boolean(),
  consentText: z.string().min(1).max(300),
});

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return new NextResponse("Unauthorized", { status: 401 });

  const beta = await requireBetaAccess({
    supabase,
    userId: auth.user.id,
    userEmail: auth.user.email,
  });
  if (!beta.ok) return new NextResponse("Private beta access required.", { status: 403 });

  const rl = rateLimit(`job_create:${auth.user.id}`, { capacity: 10, refillPerSecond: 1 / 10 });
  if (!rl.allowed) return new NextResponse("Too many requests. Try again later.", { status: 429 });

  const body = schema.parse(await request.json());
  const env = getServerEnv();

  if (!body.consentConfirmed) {
    return new NextResponse("Consent is required.", { status: 400 });
  }

  // Ensure the uploaded paths belong to the user (prevents path injection).
  const { count, error: countErr } = await supabase
    .from("photo_uploads")
    .select("id", { count: "exact", head: true })
    .eq("user_id", auth.user.id)
    .in("storage_path", body.inputImagePaths);
  if (countErr) return new NextResponse(countErr.message, { status: 400 });
  if ((count ?? 0) < body.inputImagePaths.length) {
    return new NextResponse("One or more uploaded images could not be verified.", { status: 400 });
  }

  const { data, error } = await supabase
    .from("generation_jobs")
    .insert({
      user_id: auth.user.id,
      status: "uploaded",
      selected_styles: [],
      input_image_paths: body.inputImagePaths,
      output_image_paths: [],
      provider: env.AI_PROVIDER ?? "mock",
      consent_confirmed: true,
      consent_text: body.consentText,
      consent_confirmed_at: new Date().toISOString(),
      requested_images: (PLANS.find((p) => p.id === (body.plan ?? "pro"))?.images ?? 80),
    })
    .select("id")
    .single();

  if (error) return new NextResponse(error.message, { status: 400 });
  logger.info("job_created", { userId: auth.user.id, jobId: data.id });
  return NextResponse.json({ jobId: data.id });
}
