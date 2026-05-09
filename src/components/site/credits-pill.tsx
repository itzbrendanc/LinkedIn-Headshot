"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";

export function CreditsPill() {
  const [balance, setBalance] = React.useState<number | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const res = await fetch("/api/billing/summary", { cache: "no-store" });
        if (!res.ok) return;
        const json = (await res.json()) as { balance?: number };
        if (!cancelled && typeof json.balance === "number") setBalance(json.balance);
      } catch {
        // ignore
      }
    }
    queueMicrotask(() => void run());
    return () => {
      cancelled = true;
    };
  }, []);

  if (balance === null) return null;

  return (
    <Badge className="border-white/10 bg-white/10 text-white">
      Credits: {balance}
    </Badge>
  );
}

