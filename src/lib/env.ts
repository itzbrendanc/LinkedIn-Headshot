import { z } from "zod";

const optionalNonEmptyString = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
  z.string().min(1).optional(),
);

const optionalUrl = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
  z.string().url().optional(),
);

const optionalEmail = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
  z.string().email().optional(),
);

const serverSchema = z.object({
  NEXT_PUBLIC_SITE_URL: optionalUrl,
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  STRIPE_SECRET_KEY: optionalNonEmptyString,
  STRIPE_WEBHOOK_SECRET: optionalNonEmptyString,
  AI_PROVIDER: z.string().default("mock"),
  FAL_KEY: optionalNonEmptyString,
  FAL_MODEL_ID: optionalNonEmptyString,
  REPLICATE_API_TOKEN: optionalNonEmptyString,
  OPENAI_API_KEY: optionalNonEmptyString,
  ADMIN_EMAILS: optionalNonEmptyString,
  BETA_ACCESS_ENABLED: z
    .string()
    .transform((v) => v === "true")
    .optional(),
  BETA_ACCESS_CODES: optionalNonEmptyString,
  SUPPORT_EMAIL: optionalEmail,
});

const clientSchema = z.object({
  NEXT_PUBLIC_SITE_URL: optionalUrl,
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
