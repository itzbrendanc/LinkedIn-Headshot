"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/site/container";
import { Badge } from "@/components/ui/badge";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white/12 via-transparent to-transparent" />
      <Container className="py-16 sm:py-24">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="max-w-2xl">
            <Badge className="mb-6 border-white/10 bg-white/5 text-white">
              Premium LinkedIn headshots
            </Badge>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-balance text-4xl font-semibold tracking-tight sm:text-6xl"
            >
              Studio-quality LinkedIn headshots from your selfies.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.05 }}
              className="mt-6 text-pretty text-lg leading-7 text-white/70"
            >
              Upload 10–20 photos. Choose your professional look. Get realistic,
              LinkedIn-ready headshots that still look like you — in minutes.
            </motion.p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button asChild size="lg" className="rounded-full">
                <Link href="/upload">Create My Headshots</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full border-white/15 bg-transparent text-white hover:bg-white/5"
              >
                <Link href="/pricing">View pricing</Link>
              </Button>
            </div>
            <div className="mt-8 grid gap-2 text-sm text-white/60 sm:grid-cols-3">
              <div>
                <div className="text-white/80">Realism first</div>
                <div className="text-white/55">
                  Natural texture, accurate identity.
                </div>
              </div>
              <div>
                <div className="text-white/80">Private by default</div>
                <div className="text-white/55">
                  Only you can view/download.
                </div>
              </div>
              <div>
                <div className="text-white/80">Fast turnaround</div>
                <div className="text-white/55">Minutes, not days.</div>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-6 -z-10 rounded-[32px] bg-gradient-to-br from-white/10 via-white/5 to-transparent blur-2xl" />
            <div className="grid grid-cols-2 gap-3 rounded-[28px] border border-white/10 bg-white/5 p-3 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset]">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[4/5] overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/10 to-white/0"
                />
              ))}
            </div>
            <p className="mt-4 text-xs text-white/50">
              Demo tiles — connect a provider to display real outputs.
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
