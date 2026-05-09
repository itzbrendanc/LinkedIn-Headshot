import { NextResponse } from "next/server";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  userRating: z.enum(["up", "down", "none"]).optional(),
  isFavorite: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = schema.parse(await request.json());

  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return new NextResponse("Unauthorized", { status: 401 });

  const rl = rateLimit(`review:${auth.user.id}`, { capacity: 60, refillPerSecond: 2 });
  if (!rl.allowed) return new NextResponse("Too many requests. Slow down.", { status: 429 });

  const patch: Record<string, unknown> = {};
  if (typeof body.isFavorite === "boolean") patch.is_favorite = body.isFavorite;
  if (body.userRating) patch.user_rating = body.userRating === "none" ? null : body.userRating;

  const { error } = await supabase
    .from("generated_images")
    .update(patch)
    .eq("id", id)
    .eq("user_id", auth.user.id);

  if (error) return new NextResponse(error.message, { status: 400 });
  return NextResponse.json({ ok: true });
}
