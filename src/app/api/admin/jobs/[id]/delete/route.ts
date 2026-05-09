import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getServerEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const env = getServerEnv();
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return new NextResponse("Unauthorized", { status: 401 });

  const allowed = new Set(
    (env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
  if (!auth.user.email || !allowed.has(auth.user.email.toLowerCase())) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const rl = rateLimit(`admin_delete:${auth.user.id}`, { capacity: 20, refillPerSecond: 1 / 2 });
  if (!rl.allowed) return new NextResponse("Too many requests.", { status: 429 });

  const admin = createSupabaseAdminClient();

  const { data: job } = await admin
    .from("generation_jobs")
    .select("id,user_id")
    .eq("id", id)
    .maybeSingle();
  if (!job) return new NextResponse("Not found", { status: 404 });

  const { data: outputs } = await admin
    .from("generated_images")
    .select("storage_path")
    .eq("job_id", id);
  const outputPaths = (outputs ?? []).map((o) => o.storage_path as string);
  if (outputPaths.length) await admin.storage.from("outputs").remove(outputPaths);

  await admin.from("generated_images").delete().eq("job_id", id);
  await admin.from("generation_jobs").update({ deleted_at: new Date().toISOString() }).eq("id", id);

  logger.warn("admin_job_deleted", { jobId: id, adminEmail: auth.user.email });
  return NextResponse.json({ ok: true });
}

