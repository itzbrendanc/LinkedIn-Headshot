import { NextResponse } from "next/server";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import { requireBetaAccess } from "@/lib/beta-access";

const schema = z.object({
  jobId: z.string().uuid(),
  realism: z.number().int().min(1).max(5),
  identity: z.number().int().min(1).max(5),
  professional: z.number().int().min(1).max(5),
  wouldUseLinkedIn: z.boolean(),
  comments: z.string().max(2000).optional(),
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

  const rl = rateLimit(`feedback:${auth.user.id}`, { capacity: 20, refillPerSecond: 1 / 10 });
  if (!rl.allowed) return new NextResponse("Too many requests. Try again later.", { status: 429 });

  const body = schema.parse(await request.json());

  // Ensure job ownership.
  const { data: job } = await supabase
    .from("generation_jobs")
    .select("id")
    .eq("id", body.jobId)
    .eq("user_id", auth.user.id)
    .maybeSingle();
  if (!job) return new NextResponse("Not found", { status: 404 });

  const { error } = await supabase.from("beta_feedback").upsert({
    user_id: auth.user.id,
    job_id: body.jobId,
    realism_rating: body.realism,
    identity_rating: body.identity,
    professional_rating: body.professional,
    would_use_linkedin: body.wouldUseLinkedIn,
    comments: body.comments ?? null,
  }, { onConflict: "user_id,job_id" });

  if (error) return new NextResponse(error.message, { status: 400 });
  return NextResponse.json({ ok: true });
}
