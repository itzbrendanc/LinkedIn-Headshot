import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { requireBetaAccess } from "@/lib/beta-access";

export async function POST() {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return new NextResponse("Unauthorized", { status: 401 });

  const beta = await requireBetaAccess({
    supabase,
    userId: auth.user.id,
    userEmail: auth.user.email,
  });
  if (!beta.ok) return new NextResponse("Private beta access required.", { status: 403 });

  const rl = rateLimit(`uploads_meta:${auth.user.id}`, { capacity: 30, refillPerSecond: 1 });
  if (!rl.allowed) return new NextResponse("Too many requests. Slow down.", { status: 429 });

  // In the MVP we upload directly to Supabase Storage from the browser.
  // This endpoint exists as a future hook for signed upload URLs, limits, and abuse prevention.
  logger.debug("uploads_meta", { userId: auth.user.id });
  return NextResponse.json({
    bucket: "uploads",
    prefix: `${auth.user.id}/`,
    minImages: 10,
    maxImages: 20,
  });
}
