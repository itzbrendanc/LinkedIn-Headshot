import { redirect } from "next/navigation";

import { BetaWall } from "@/components/beta/beta-wall";
import { Container } from "@/components/site/container";
import { StyleSelector } from "@/components/styles/style-selector";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function StylesPage({
  searchParams,
}: {
  searchParams: Promise<{ job?: string; plan?: string }>;
}) {
  const sp = await searchParams;
  const jobId = sp.job;
  const plan = sp.plan ?? "pro";
  return (
    <BetaWall nextPath={jobId ? `/styles?job=${encodeURIComponent(jobId)}&plan=${encodeURIComponent(plan)}` : "/styles"}>
      <StylesInner searchParams={searchParams} />
    </BetaWall>
  );
}

async function StylesInner({
  searchParams,
}: {
  searchParams: Promise<{ job?: string; plan?: string }>;
}) {
  const sp = await searchParams;
  const jobId = sp.job;
  const plan = sp.plan ?? "pro";
  if (!jobId) redirect("/upload");

  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/dashboard");

  const { data: presets, error } = await supabase
    .from("style_presets")
    .select("*")
    .order("name", { ascending: true });

  if (error) console.error(error);

  return (
    <main className="bg-black">
      <Container className="py-10 sm:py-14">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-semibold tracking-tight">Choose your style</h1>
          <p className="mt-2 text-white/65">
            Pick the professional looks you want. You can regenerate styles while credits remain.
          </p>
        </div>
        <div className="mt-10">
          <StyleSelector
            jobId={jobId}
            plan={plan}
            presets={(presets ?? []).map((p) => ({
              id: p.id as string,
              name: p.name as string,
              description: (p.description as string) ?? "",
              outfit: p.outfit as string,
              background: p.background as string,
              lighting: p.lighting as string,
              mood: p.mood as string,
              framing: p.framing as string,
              promptTemplate: p.prompt_template as string,
              negativePrompt: p.negative_prompt as string,
            }))}
          />
        </div>
      </Container>
    </main>
  );
}
