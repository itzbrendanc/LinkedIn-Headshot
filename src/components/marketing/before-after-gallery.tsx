import { Container } from "@/components/site/container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function BeforeAfterGallery() {
  return (
    <section className="border-y border-white/5 bg-white/[0.03]">
      <Container className="py-14 sm:py-20">
        <div className="flex flex-col gap-3">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Before / after, without the “AI look”
          </h2>
          <p className="max-w-2xl text-white/65">
            The goal is realism: natural texture, accurate identity, and
            professional studio lighting — not glamour filters.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { title: "Natural skin texture", desc: "No plastic smoothing." },
            { title: "Accurate facial identity", desc: "Preserve face shape." },
            { title: "LinkedIn-ready crop", desc: "Clean, professional framing." },
          ].map((c) => (
            <Card key={c.title} className="border-white/10 bg-black/30">
              <CardHeader>
                <CardTitle className="text-white">{c.title}</CardTitle>
                <CardDescription className="text-white/60">{c.desc}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <div className="aspect-[4/5] rounded-2xl border border-white/10 bg-gradient-to-b from-white/10 to-white/0" />
                  <div className="aspect-[4/5] rounded-2xl border border-white/10 bg-gradient-to-b from-white/15 to-white/0" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="mt-6 text-xs text-white/50">
          Gallery placeholders — connect an image provider to display real before/after examples.
        </p>
      </Container>
    </section>
  );
}

