import Link from "next/link";

import { Container } from "@/components/site/container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function TrustSafetySection() {
  const items = [
    {
      title: "Consent-first",
      body: "You must confirm these photos are of you and you have permission to use them.",
    },
    {
      title: "No minors / no celebrity cloning",
      body: "We prohibit minors, celebrity impersonation, and deceptive uses.",
    },
    {
      title: "Private by default",
      body: "Uploads and results are private to your account by default.",
    },
    {
      title: "Auto-delete inputs",
      body: "Input photos are deleted after 30 days by default (configurable).",
    },
  ];

  return (
    <section className="border-t border-white/5">
      <Container className="py-14 sm:py-20">
        <div className="flex flex-col gap-3">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Trust, privacy, and safety
          </h2>
          <p className="max-w-2xl text-white/65">
            Built for professional outcomes — with clear rules. Read our{" "}
            <Link href="/privacy" className="text-white underline underline-offset-4">
              privacy policy
            </Link>{" "}
            and{" "}
            <Link href="/terms" className="text-white underline underline-offset-4">
              terms
            </Link>
            .
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((i) => (
            <Card key={i.title} className="border-white/10 bg-black/30">
              <CardHeader>
                <CardTitle className="text-white text-base">{i.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-white/65">{i.body}</CardContent>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}
