"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CreditsPill } from "@/components/site/credits-pill";
import { PrivateBetaBadge } from "@/components/beta/private-beta-badge";

const navLinks = [
  { href: "/pricing", label: "Pricing" },
  { href: "/upload", label: "Create" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/billing", label: "Billing" },
  { href: "/dashboard/settings", label: "Settings" },
];

export function SiteNav() {
  const pathname = usePathname();
  return (
    <div className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/50">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-white/20 to-white/5 ring-1 ring-white/10 dark:from-white/10 dark:to-white/0" />
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight">Headshot Company</div>
            <div className="text-xs text-muted-foreground">AI LinkedIn headshots</div>
          </div>
        </Link>
        <div className="hidden items-center gap-6 sm:flex">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "text-sm text-muted-foreground hover:text-foreground",
                pathname === l.href && "text-foreground",
              )}
            >
              {l.label}
            </Link>
          ))}
          <PrivateBetaBadge />
          <CreditsPill />
          <Button asChild size="sm" className="rounded-full">
            <Link href="/upload">Create My Headshots</Link>
          </Button>
        </div>
        <Button asChild size="sm" className="sm:hidden rounded-full">
          <Link href="/upload">Create</Link>
        </Button>
      </div>
    </div>
  );
}
