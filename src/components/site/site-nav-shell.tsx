import { SiteNav } from "@/components/site/site-nav";

export function SiteNavShell() {
  // Server-only: read from process.env without requiring service role key validation.
  const betaEnabled = process.env.BETA_ACCESS_ENABLED === "true";
  return <SiteNav betaEnabled={betaEnabled} />;
}

