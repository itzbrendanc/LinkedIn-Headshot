"use client";

import * as React from "react";

import { Checkbox } from "@/components/ui/checkbox";

const ITEMS = [
  "Env vars set in production (Supabase + Stripe + AI provider)",
  "Supabase migrations applied (0001 → latest)",
  "Supabase Storage buckets exist and are private (uploads, outputs)",
  "Stripe webhook configured and verified (prod URL)",
  "Worker running (dev loop / cron / long-running)",
  "Beta access enabled + codes generated",
  "Test signup + beta redeem completed",
  "Test checkout completed (credits granted)",
  "Test generation completed (worker → ready)",
  "Support email set and visible in app",
  "ADMIN_EMAILS set (you can access /admin/*)",
];

const STORAGE_KEY = "hcg_admin_launch_checklist_v1";

export function AdminLaunchChecklistClient() {
  const [checked, setChecked] = React.useState<Record<string, boolean>>(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
    } catch {
      return {};
    }
  });

  React.useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(checked));
    } catch {
      // ignore
    }
  }, [checked]);

  const done = ITEMS.filter((i) => checked[i]).length;

  return (
    <div className="grid gap-4">
      <div className="text-sm text-white/70">
        {done}/{ITEMS.length} completed
      </div>
      <div className="grid gap-3">
        {ITEMS.map((label) => (
          <label
            key={label}
            className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-white/80"
          >
            <Checkbox
              checked={Boolean(checked[label])}
              onCheckedChange={(v) =>
                setChecked((prev) => ({ ...prev, [label]: Boolean(v) }))
              }
              className="mt-0.5"
            />
            <span className="leading-relaxed">{label}</span>
          </label>
        ))}
      </div>
      <button
        type="button"
        className="text-left text-xs text-white/50 underline-offset-4 hover:underline"
        onClick={() => setChecked({})}
      >
        Reset checklist
      </button>
    </div>
  );
}
