import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/admin-auth";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

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

  const { data: outputs } = await admin.from("generated_images").select("storage_path").eq("job_id", id);
  const outputPaths = (outputs ?? []).map((o) => o.storage_path as string);
  if (outputPaths.length) await admin.storage.from("outputs").remove(outputPaths);

  await admin.from("generated_images").delete().eq("job_id", id);
  await admin.from("generation_jobs").update({ deleted_at: new Date().toISOString(), is_abusive: true }).eq("id", id);
  logger.warn("admin_delete_abusive_job", { adminEmail: auth.user.email, jobId: id });
  return NextResponse.json({ ok: true });
}

