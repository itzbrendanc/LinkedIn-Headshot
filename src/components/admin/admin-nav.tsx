"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin/launch-checklist", label: "Launch" },
  { href: "/admin/beta", label: "Beta" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/jobs", label: "Jobs" },
  { href: "/admin/feedback", label: "Feedback" },
  { href: "/admin/metrics", label: "Metrics" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <div className="flex flex-wrap items-center gap-1 rounded-full border border-white/10 bg-black/30 p-1">
      {LINKS.map((l) => {
        const active = pathname === l.href || (l.href !== "/admin/jobs" ? false : pathname.startsWith("/admin/jobs"));
        return (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              "rounded-full px-3 py-1 text-sm transition",
              active ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5 hover:text-white",
            )}
          >
            {l.label}
          </Link>
        );
      })}
    </div>
  );
}

