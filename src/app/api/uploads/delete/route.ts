import { NextResponse } from "next/server";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  storagePaths: z.array(z.string().min(1)).min(1).max(50),
});

export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return new NextResponse("Unauthorized", { status: 401 });

  const rl = rateLimit(`delete_uploads:${auth.user.id}`, { capacity: 10, refillPerSecond: 1 / 5 });
  if (!rl.allowed) return new NextResponse("Too many requests. Try again later.", { status: 429 });

  const { storagePaths } = schema.parse(await request.json());
  const requestId = crypto.randomUUID();
  logger.info("uploads_delete_requested", { requestId, userId: auth.user.id, count: storagePaths.length });

  const admin = createSupabaseAdminClient();

  // Verify ownership: all paths must exist for this user.
  const { count } = await admin
    .from("photo_uploads")
    .select("id", { count: "exact", head: true })
    .eq("user_id", auth.user.id)
    .in("storage_path", storagePaths);

  if ((count ?? 0) !== storagePaths.length) {
    return new NextResponse("One or more uploads could not be verified.", { status: 400 });
  }

  await admin.storage.from("uploads").remove(storagePaths);
  await admin.from("photo_uploads").delete().eq("user_id", auth.user.id).in("storage_path", storagePaths);

  logger.info("uploads_delete_completed", { requestId, userId: auth.user.id });
  return NextResponse.json({ ok: true });
}

