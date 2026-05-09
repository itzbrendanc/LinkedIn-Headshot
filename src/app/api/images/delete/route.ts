import { NextResponse } from "next/server";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  imageIds: z.array(z.string().uuid()).min(1).max(50),
});

export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return new NextResponse("Unauthorized", { status: 401 });

  const rl = rateLimit(`delete_images:${auth.user.id}`, { capacity: 20, refillPerSecond: 1 / 2 });
  if (!rl.allowed) return new NextResponse("Too many requests. Try again later.", { status: 429 });

  const { imageIds } = schema.parse(await request.json());
  const requestId = crypto.randomUUID();
  logger.info("images_delete_requested", { requestId, userId: auth.user.id, count: imageIds.length });

  const admin = createSupabaseAdminClient();
  const { data: imgs } = await admin
    .from("generated_images")
    .select("id,storage_bucket,storage_path")
    .eq("user_id", auth.user.id)
    .in("id", imageIds);

  if ((imgs ?? []).length !== imageIds.length) {
    return new NextResponse("One or more images could not be verified.", { status: 400 });
  }

  const outputPaths = (imgs ?? []).map((i) => i.storage_path as string);
  if (outputPaths.length) await admin.storage.from("outputs").remove(outputPaths);
  await admin.from("generated_images").delete().eq("user_id", auth.user.id).in("id", imageIds);

  logger.info("images_delete_completed", { requestId, userId: auth.user.id });
  return NextResponse.json({ ok: true });
}

