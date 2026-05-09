import { getServerEnv } from "@/lib/env";

export function isBetaEnabled() {
  const env = getServerEnv();
  return Boolean(env.BETA_ACCESS_ENABLED);
}

export function getBetaCodes(): string[] {
  const env = getServerEnv();
  return (env.BETA_ACCESS_CODES ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

