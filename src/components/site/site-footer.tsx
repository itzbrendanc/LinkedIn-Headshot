import Link from "next/link";

import { Container } from "@/components/site/container";
import { getServerEnv } from "@/lib/env";

export function SiteFooter() {
  const env = getServerEnv();
  const supportEmail = env.SUPPORT_EMAIL;
  return (
    <footer className="border-t border-border/60">
      <Container className="flex flex-col gap-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Headshot Company. All rights reserved.
        </div>
        <div className="flex flex-wrap items-center gap-6 text-sm">
          {supportEmail ? (
            <a
              href={`mailto:${supportEmail}`}
              className="text-muted-foreground hover:text-foreground"
            >
              Support
            </a>
          ) : null}
          <Link href="/pricing" className="text-muted-foreground hover:text-foreground">
            Pricing
          </Link>
          <Link href="/privacy" className="text-muted-foreground hover:text-foreground">
            Privacy
          </Link>
          <Link href="/terms" className="text-muted-foreground hover:text-foreground">
            Terms
          </Link>
          <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
            Dashboard
          </Link>
        </div>
      </Container>
    </footer>
  );
}
