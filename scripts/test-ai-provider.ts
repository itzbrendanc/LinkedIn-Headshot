import { getServerEnv } from "../src/lib/env";
import { getHeadshotProvider } from "../src/lib/ai/provider";

async function main() {
  let env: ReturnType<typeof getServerEnv>;
  try {
    env = getServerEnv();
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
    return;
  }

  const provider = getHeadshotProvider();
  console.log(`AI_PROVIDER=${env.AI_PROVIDER} -> ${provider.name}`);

  if (provider.name === "fal" && !env.FAL_KEY) {
    console.error("Missing FAL_KEY. Create a fal API key and set FAL_KEY in .env.local.");
    process.exit(1);
  }

  if (provider.name === "replicate" && !env.REPLICATE_API_TOKEN) {
    console.error("Missing REPLICATE_API_TOKEN. Set it or use AI_PROVIDER=mock.");
    process.exit(1);
  }

  if (provider.name === "openai" && !env.OPENAI_API_KEY) {
    console.error("Missing OPENAI_API_KEY. Set it or use AI_PROVIDER=mock.");
    process.exit(1);
  }

  const doRun = process.env.AI_PROVIDER_DRY_RUN === "1";
  if (!doRun) {
    console.log("Dry-run skipped. Set AI_PROVIDER_DRY_RUN=1 to make a tiny provider call.");
    return;
  }

  if (provider.name === "mock") {
    const out = await provider.generateHeadshots({
      userId: "test-user",
      jobId: "test-job",
      selectedStyleIds: ["corporate-executive"],
      stylePresets: [
        {
          id: "corporate-executive",
          name: "Corporate Executive",
          outfit: "tailored navy suit",
          background: "neutral studio backdrop",
          lighting: "premium studio lighting",
          mood: "confident and approachable",
          framing: "head-and-shoulders",
          promptTemplate: "test [OUTFIT] [BACKGROUND]",
          negativePrompt: "waxy skin",
        },
      ],
      referenceImageUrls: ["https://example.com/ref.jpg"],
      imagesPerStyle: 1,
    });
    console.log(`Mock provider OK. Generated ${out.length} placeholder images.`);
    return;
  }

  if (provider.name === "fal") {
    console.log("Running a tiny Fal dry-run (may incur cost)...");
    const out = await provider.generateHeadshots({
      userId: "test-user",
      jobId: "test-job",
      selectedStyleIds: ["corporate-executive"],
      stylePresets: [
        {
          id: "corporate-executive",
          name: "Corporate Executive",
          outfit: "tailored navy suit, white dress shirt",
          background: "soft neutral studio backdrop",
          lighting: "premium studio lighting, soft key, subtle rim light",
          mood: "confident and approachable",
          framing: "LinkedIn-safe head-and-shoulders",
          promptTemplate:
            "Ultra-realistic professional LinkedIn headshot of the same person from the uploaded reference photos, wearing [OUTFIT], background [BACKGROUND].",
          negativePrompt:
            "cartoon, illustration, waxy skin, fake eyes, distorted face, extra teeth",
        },
      ],
      // Public example image from Fal docs.
      referenceImageUrls: [
        "https://storage.googleapis.com/falserverless/example_inputs/dog.png",
      ],
      imagesPerStyle: 1,
    });
    console.log(
      `Fal provider OK. Returned ${out.length} image(s). First sourceUrl: ${out[0]?.sourceUrl ?? "n/a"}`,
    );
    return;
  }

  console.log(
    "Dry-run not implemented for this provider yet. Use AI_PROVIDER=mock or AI_PROVIDER=fal.",
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

