"use client";

export function PrivateBetaBadge({ enabled }: { enabled: boolean }) {
  if (!enabled) return null;
  return (
    <span className="rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-xs text-white">
      Private Beta
    </span>
  );
}
