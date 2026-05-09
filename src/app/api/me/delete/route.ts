import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST() {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return new NextResponse("Unauthorized", { status: 401 });

  const rl = rateLimit(`delete_all:${auth.user.id}`, { capacity: 2, refillPerSecond: 1 / 600 });
  if (!rl.allowed) return new NextResponse("Too many requests. Try again later.", { status: 429 });

  const requestId = crypto.randomUUID();
  logger.warn("delete_all_requested", { requestId, userId: auth.user.id });

  const admin = createSupabaseAdminClient();

  // Collect storage paths.
  const { data: uploads } = await admin
    .from("photo_uploads")
    .select("storage_bucket,storage_path")
    .eq("user_id", auth.user.id);

  const { data: outputs } = await admin
    .from("generated_images")
    .select("storage_bucket,storage_path")
    .eq("user_id", auth.user.id);

  // Remove storage objects (best effort).
  const uploadPaths = (uploads ?? []).map((u) => u.storage_path as string);
  const outputPaths = (outputs ?? []).map((o) => o.storage_path as string);

  if (uploadPaths.length) {
    await admin.storage.from("uploads").remove(uploadPaths);
  }
  if (outputPaths.length) {
    await admin.storage.from("outputs").remove(outputPaths);
  }

  // Delete DB rows (cascades handle most relationships).
  await admin.from("generated_images").delete().eq("user_id", auth.user.id);
  await admin.from("photo_uploads").delete().eq("user_id", auth.user.id);
  await admin.from("generation_jobs").update({ deleted_at: new Date().toISOString() }).eq("user_id", auth.user.id);
  await admin.from("orders").delete().eq("user_id", auth.user.id);
  await admin.from("stripe_checkout_sessions").delete().eq("user_id", auth.user.id);
  await admin.from("credit_transactions").delete().eq("user_id", auth.user.id);
  await admin.from("user_credits").delete().eq("user_id", auth.user.id);

  // Finally, delete auth user.
  await admin.auth.admin.deleteUser(auth.user.id);

  logger.warn("delete_all_completed", { requestId, userId: auth.user.id });
  return NextResponse.json({ ok: true });
}
