import { z } from "zod";

const serverSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
  AI_PROVIDER: z.string().default("mock"),
  FAL_KEY: z.string().min(1).optional(),
  FAL_MODEL_ID: z.string().min(1).optional(),
  REPLICATE_API_TOKEN: z.string().min(1).optional(),
  OPENAI_API_KEY: z.string().min(1).optional(),
  ADMIN_EMAILS: z.string().optional(),
  BETA_ACCESS_ENABLED: z
    .string()
    .transform((v) => v === "true")
    .optional(),
  BETA_ACCESS_CODES: z.string().optional(),
  SUPPORT_EMAIL: z.string().email().optional(),
});

const clientSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

export function getServerEnv() {
  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    const keys = parsed.error.issues
      .map((i) => i.path.join("."))
      .filter(Boolean);
    const unique = Array.from(new Set(keys));
    throw new Error(
      `Missing/invalid environment variables: ${unique.join(
        ", ",
      )}. Copy .env.example to .env.local and fill required keys.`,
    );
  }
  return parsed.data;
}

export function getClientEnv() {
  const parsed = clientSchema.safeParse({
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
  if (!parsed.success) {
    const keys = parsed.error.issues
      .map((i) => i.path.join("."))
      .filter(Boolean);
    const unique = Array.from(new Set(keys));
    throw new Error(
      `Missing/invalid client environment variables: ${unique.join(
        ", ",
      )}. Set them in .env.local.`,
    );
  }
  return parsed.data;
}
