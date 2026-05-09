import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return new NextResponse("Unauthorized", { status: 401 });

  const rl = rateLimit(`delete_job:${auth.user.id}`, { capacity: 10, refillPerSecond: 1 / 10 });
  if (!rl.allowed) return new NextResponse("Too many requests. Try again later.", { status: 429 });

  const requestId = crypto.randomUUID();
  logger.warn("job_delete_requested", { requestId, userId: auth.user.id, jobId: id });

  const admin = createSupabaseAdminClient();

  const { data: job } = await admin
    .from("generation_jobs")
    .select("id,user_id")
    .eq("id", id)
    .eq("user_id", auth.user.id)
    .maybeSingle();
  if (!job) return new NextResponse("Not found", { status: 404 });

  const { data: outputs } = await admin
    .from("generated_images")
    .select("storage_bucket,storage_path")
    .eq("job_id", id)
    .eq("user_id", auth.user.id);

  const outputPaths = (outputs ?? []).map((o) => o.storage_path as string);
  if (outputPaths.length) await admin.storage.from("outputs").remove(outputPaths);

  await admin.from("generated_images").delete().eq("job_id", id).eq("user_id", auth.user.id);
  await admin.from("generation_jobs").update({ deleted_at: new Date().toISOString() }).eq("id", id).eq("user_id", auth.user.id);

  logger.warn("job_delete_completed", { requestId, userId: auth.user.id, jobId: id });
  return NextResponse.json({ ok: true });
}

