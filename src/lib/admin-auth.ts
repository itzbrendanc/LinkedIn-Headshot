import { getServerEnv } from "@/lib/env";

export function isAdminEmail(email?: string | null) {
  const env = getServerEnv();
  const allowed = new Set(
    (env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
  if (!email) return false;
  return allowed.has(email.toLowerCase());
}

