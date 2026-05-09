import { NextResponse } from "next/server";
import JSZip from "jszip";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

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
    .select("id,style_id,storage_bucket,storage_path")
    .eq("job_id", id)
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: true });
  if (error) return new NextResponse(error.message, { status: 400 });

  const admin = createSupabaseAdminClient();
  const zip = new JSZip();

  for (const img of imgs ?? []) {
    const { data, error: dlErr } = await admin.storage
      .from(img.storage_bucket as string)
      .download(img.storage_path as string);
    if (dlErr || !data) continue;

    const arrayBuffer = await data.arrayBuffer();
    const ext = (img.storage_path as string).split(".").pop() ?? "bin";
    zip.file(`${img.style_id}-${img.id}.${ext}`, Buffer.from(arrayBuffer));
  }

  const content = await zip.generateAsync({ type: "nodebuffer" });
  return new NextResponse(new Uint8Array(content), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="headshots-${id}.zip"`,
    },
  });
}
