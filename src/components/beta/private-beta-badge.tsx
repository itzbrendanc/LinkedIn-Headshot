import { getServerEnv } from "@/lib/env";

export function PrivateBetaBadge() {
  const env = getServerEnv();
  if (!env.BETA_ACCESS_ENABLED) return null;
  return (
    <span className="rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-xs text-white">
      Private Beta
    </span>
  );
}

