import type { Metadata } from "next";
import "./globals.css";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteNavShell } from "@/components/site/site-nav-shell";

export const metadata: Metadata = {
  title: "Headshot Company — Premium AI LinkedIn headshots",
  description:
    "Studio-quality LinkedIn headshots from your selfies. Upload photos, pick a style, and get realistic professional headshots.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased dark"
    >
      <body className="min-h-full flex flex-col bg-black text-white">
        <div className="pointer-events-none fixed inset-0 -z-10 noise opacity-40" />
        <SiteNavShell />
        <div className="flex-1">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
