import { NextResponse } from "next/server";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireBetaAccess } from "@/lib/beta-access";

const schema = z.object({
  reason: z.enum(["similar", "style"]),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { reason } = schema.parse(await request.json());

  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return new NextResponse("Unauthorized", { status: 401 });

  const beta = await requireBetaAccess({
    supabase,
    userId: auth.user.id,
    userEmail: auth.user.email,
  });
  if (!beta.ok) return new NextResponse("Private beta access required.", { status: 403 });

  const { data: img, error } = await supabase
    .from("generated_images")
    .select("id,job_id,style_id")
    .eq("id", id)
    .eq("user_id", auth.user.id)
    .maybeSingle();
  if (error) return new NextResponse(error.message, { status: 400 });
  if (!img) return new NextResponse("Not found", { status: 404 });

  const res = await fetch(
    new URL(`/api/jobs/${encodeURIComponent(img.job_id as string)}/regenerate`, request.url),
    {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: request.headers.get("cookie") ?? "" },
      body: JSON.stringify({
        reason,
        styleId: img.style_id as string,
        imageId: reason === "similar" ? (img.id as string) : undefined,
      }),
    },
  );

  if (!res.ok) return new NextResponse(await res.text(), { status: res.status });
  const json = (await res.json()) as { jobId: string };
  return NextResponse.json(json);
}
