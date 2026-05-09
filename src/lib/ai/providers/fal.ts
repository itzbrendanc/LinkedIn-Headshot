import type {
  EnhanceInput,
  EnhancedImage,
  GenerateHeadshotsInput,
  GeneratedImage,
  HeadshotProvider,
  ModelRef,
  TrainIdentityInput,
} from "@/lib/ai/providers/base";
import { getServerEnv } from "@/lib/env";

export class FalHeadshotProvider implements HeadshotProvider {
  name = "fal";

  async trainIdentityModel(_input: TrainIdentityInput): Promise<ModelRef> {
    void _input;
    // Flux endpoints don't require explicit "training" for this MVP.
    return { provider: this.name, id: "flux-identity-inline" };
  }

  async generateHeadshots(_input: GenerateHeadshotsInput): Promise<GeneratedImage[]> {
    const env = getServerEnv();
    if (!env.FAL_KEY) {
      throw new Error(
        "FAL_KEY is required when AI_PROVIDER=fal. Set FAL_KEY in .env.local (API scope key).",
      );
    }

    const modelId = env.FAL_MODEL_ID ?? "fal-ai/flux-lora/image-to-image";
    const endpoint = `https://fal.run/${modelId}`;

    const referenceImages = _input.referenceImageUrls;
    if (!referenceImages || referenceImages.length === 0) {
      throw new Error("No reference images provided to Fal provider.");
    }

    const presetsById = new Map(_input.stylePresets.map((s) => [s.id, s]));

    const results: GeneratedImage[] = [];
    for (const styleId of _input.selectedStyleIds) {
      const preset = presetsById.get(styleId);
      if (!preset) continue;

      const imagesNeeded = Math.max(1, _input.imagesPerStyle);
      const maxBatch = 4; // per Fal docs
      let createdForStyle = 0;

      while (createdForStyle < imagesNeeded) {
        const batch = Math.min(maxBatch, imagesNeeded - createdForStyle);
        const refUrl =
          referenceImages[Math.floor(Math.random() * referenceImages.length)]!;

        const prompt = buildPrompt(preset);
        const body = {
          prompt,
          image_url: refUrl,
          strength: 0.78,
          image_size: "portrait_4_3",
          num_inference_steps: 32,
          guidance_scale: 3.5,
          num_images: batch,
          enable_safety_checker: true,
          output_format: "jpeg",
          acceleration: "regular",
        };

        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            Authorization: `Key ${env.FAL_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(
            `Fal request failed (${res.status}). ${text || "Check FAL_KEY and model permissions."}`,
          );
        }

        const json = (await res.json()) as {
          images?: Array<{
            url: string;
            content_type?: string;
            width?: number;
            height?: number;
          }>;
          seed?: number;
        };

        const images = json.images ?? [];
        for (const img of images) {
          const id = crypto.randomUUID();
          results.push({
            id,
            storageBucket: "outputs",
            storagePath: `${_input.userId}/${_input.jobId}/${styleId}/${id}.jpg`,
            sourceUrl: img.url,
            contentType: img.content_type ?? "image/jpeg",
            width: img.width,
            height: img.height,
            generationSeed: typeof json.seed === "number" ? String(json.seed) : undefined,
          });
          createdForStyle += 1;
          if (createdForStyle >= imagesNeeded) break;
        }

        if (images.length === 0) {
          throw new Error("Fal returned no images. Try again or adjust model parameters.");
        }
      }
    }

    return results;
  }

  async enhanceImage(_input: EnhanceInput): Promise<EnhancedImage> {
    void _input;
    // Enhancement step is provider-specific; keep as no-op for now.
    return _input.image;
  }
}

function buildPrompt(style: {
  outfit: string;
  background: string;
  lighting: string;
  mood: string;
  framing: string;
  promptTemplate: string;
  negativePrompt: string;
}) {
  const base = style.promptTemplate
    .replace("[OUTFIT]", style.outfit)
    .replace("[BACKGROUND]", style.background);

  return [
    base,
    `Lighting: ${style.lighting}. Mood: ${style.mood}. Framing: ${style.framing}.`,
    "Ultra-realistic, scary-real professional corporate photography. Natural pores and skin texture. Realistic eye reflections. Accurate facial identity. No over-beautification. LinkedIn-ready crop.",
    `Avoid: ${style.negativePrompt}.`,
  ].join(" ");
}
