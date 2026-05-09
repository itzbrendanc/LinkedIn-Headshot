import { NextResponse } from "next/server";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/admin-auth";

const schema = z.object({
  count: z.number().int().min(1).max(200),
  label: z.string().max(120).nullable().optional(),
  note: z.string().max(500).nullable().optional(),
  maxRedemptions: z.number().int().min(1).max(1000).nullable().optional(),
});

function randomCode() {
  // Human-friendly base32-ish.
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 10; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)]!;
  return out;
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return new NextResponse("Unauthorized", { status: 401 });
  if (!isAdminEmail(auth.user.email)) return new NextResponse("Forbidden", { status: 403 });

  const body = schema.parse(await request.json());
  const admin = createSupabaseAdminClient();

  const rows = [];
  for (let i = 0; i < body.count; i++) {
    rows.push({
      code: randomCode(),
      label: body.label ?? null,
      note: body.note ?? null,
      max_redemptions: body.maxRedemptions ?? null,
      disabled: false,
    });
  }

  const { data, error } = await admin.from("beta_access_codes").insert(rows).select("*");
  if (error) return new NextResponse(error.message, { status: 400 });

  const codes = (data ?? []).map((c) => ({
    code: c.code as string,
    label: (c.label as string | null) ?? null,
    note: (c.note as string | null) ?? null,
    max_redemptions: (c.max_redemptions as number | null) ?? null,
    disabled: Boolean(c.disabled),
    created_at: c.created_at as string,
    redeemed_count: 0,
  }));

  return NextResponse.json({ codes });
}

