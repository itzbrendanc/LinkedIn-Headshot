import { createSupabaseAdminClient } from "../src/lib/supabase/admin";
import { STYLE_PRESETS } from "../src/lib/styles/presets";

function demoSvg(i: number) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#111827"/>
      <stop offset="1" stop-color="#000000"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#g)"/>
  <text x="512" y="520" text-anchor="middle" font-family="ui-sans-serif, system-ui" font-size="34" fill="rgba(255,255,255,0.85)" font-weight="650">
    Demo upload ${i + 1}
  </text>
</svg>`;
}

async function ensureUser(email: string, password?: string) {
  const supabase = createSupabaseAdminClient();
  const { data: existing } = await supabase.auth.admin.listUsers({ perPage: 200 });
  const found = existing.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (found) return { id: found.id, created: false };

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw error;
  if (!data.user) throw new Error("Failed to create user.");
  return { id: data.user.id, created: true };
}

async function main() {
  const email = process.env.TEST_JOB_EMAIL ?? "demo@headshot.company";
  const password = process.env.TEST_JOB_PASSWORD ?? "demo-demo-demo";

  const supabase = createSupabaseAdminClient();
  const { id: userId, created } = await ensureUser(email, password);

  // Upload 10 demo files to uploads bucket + record photo_uploads.
  const uploadPaths: string[] = [];
  for (let i = 0; i < 10; i++) {
    const path = `${userId}/demo-${Date.now()}-${i + 1}.svg`;
    const bytes = new TextEncoder().encode(demoSvg(i));
    const { error: upErr } = await supabase.storage
      .from("uploads")
      .upload(path, bytes, { contentType: "image/svg+xml", upsert: true });
    if (upErr) throw new Error(`Upload failed. Ensure private 'uploads' bucket exists. (${upErr.message})`);

    const { error: insErr } = await supabase.from("photo_uploads").insert({
      user_id: userId,
      storage_bucket: "uploads",
      storage_path: path,
      mime_type: "image/svg+xml",
      bytes: bytes.byteLength,
    });
    if (insErr) throw insErr;
    uploadPaths.push(path);
  }

  const selectedStyles = STYLE_PRESETS.slice(0, 2).map((s) => s.id);

  const { data: job, error: jobErr } = await supabase
    .from("generation_jobs")
    .insert({
      user_id: userId,
      status: "queued",
      selected_styles: selectedStyles,
      input_image_paths: uploadPaths,
      output_image_paths: [],
      provider: (process.env.AI_PROVIDER ?? "mock").toLowerCase(),
      consent_confirmed: true,
      consent_text: "I confirm these are photos of me and I have permission to use them.",
      consent_confirmed_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (jobErr) throw jobErr;

  console.log("Created test job:");
  console.log(`- user: ${email} (${created ? "created" : "existing"})`);
  console.log(`- password (if email/password auth enabled): ${password}`);
  console.log(`- jobId: ${job.id}`);
  console.log("Next:");
  console.log("- Run: npm run worker:once (or npm run worker:dev)");
  console.log("- Sign in via /dashboard using magic link (OTP) if enabled, or email/password if configured.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

