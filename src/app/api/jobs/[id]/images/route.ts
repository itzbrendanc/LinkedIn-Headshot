import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return new NextResponse("Unauthorized", { status: 401 });

  const { data: imgs, error } = await supabase
    .from("generated_images")
    .select("id,style_id,storage_bucket,storage_path,user_rating,is_favorite,created_at")
    .eq("job_id", id)
    .eq("user_id", auth.user.id)
    .order("is_favorite", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) return new NextResponse(error.message, { status: 400 });

  const styleIds = Array.from(
    new Set((imgs ?? []).map((i) => i.style_id as string)),
  );
  const presets: Array<{ id: string; name: string }> = styleIds.length
    ? (((await supabase
        .from("style_presets")
        .select("id,name")
        .in("id", styleIds)).data ?? []) as unknown as Array<{ id: string; name: string }>)
    : [];

  const styleNameById = new Map<string, string>();
  for (const p of presets) styleNameById.set(p.id, p.name);

  const images = [];
  for (const img of imgs ?? []) {
    const bucket = img.storage_bucket as string;
    const path = img.storage_path as string;
    const { data: signed } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60);
    if (!signed?.signedUrl) continue;
    const styleId = img.style_id as string;
    images.push({
      id: img.id as string,
      styleId,
      styleName: styleNameById.get(styleId),
      url: signed.signedUrl,
      userRating: (img.user_rating as "up" | "down" | null) ?? null,
      isFavorite: Boolean(img.is_favorite),
    });
  }

  const styles = styleIds
    .map((sid) => ({ id: sid, name: styleNameById.get(sid) ?? sid }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return NextResponse.json({ images, styles });
}
