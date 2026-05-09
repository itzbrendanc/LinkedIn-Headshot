import { Container } from "@/components/site/container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const pillars = [
  {
    title: "Identity preservation",
    body: "Accurate face shape and features. No “generic AI face” drift.",
  },
  {
    title: "Natural texture",
    body: "We aim for pores and subtle imperfections — not plastic smoothing.",
  },
  {
    title: "Professional lighting",
    body: "Premium studio light with realistic eye reflections and depth.",
  },
  {
    title: "LinkedIn-safe framing",
    body: "Head-and-shoulders crop that looks like real corporate photography.",
  },
];

export function RealismPillars() {
  return (
    <section className="border-y border-white/5 bg-white/[0.03]">
      <Container className="py-14 sm:py-20">
        <div className="flex flex-col gap-3">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Realism is the product
          </h2>
          <p className="max-w-2xl text-white/65">
            Our north star is “scary real” — headshots that don’t scream AI.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map((p) => (
            <Card key={p.title} className="border-white/10 bg-black/30">
              <CardHeader>
                <CardTitle className="text-white text-base">{p.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-white/65">{p.body}</CardContent>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}

