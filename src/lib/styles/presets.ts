export type StylePreset = {
  id: string;
  name: string;
  description: string;
  outfit: string;
  background: string;
  lighting: string;
  mood: string;
  framing: string;
  promptTemplate: string;
  negativePrompt: string;
};

export const DEFAULT_NEGATIVE_PROMPT =
  "cartoon, illustration, waxy skin, fake eyes, distorted face, extra teeth, asymmetrical eyes, over-smoothed skin, unrealistic hair, bad anatomy, AI-looking, glamour filter, fantasy, overprocessed, blurry, deformed hands, incorrect identity";

export const STYLE_PRESETS: StylePreset[] = [
  {
    id: "corporate-executive",
    name: "Corporate Executive",
    description: "Modern executive portrait: crisp, confident, understated luxury.",
    outfit: "tailored navy suit, white dress shirt, subtle tie",
    background: "soft neutral studio backdrop, gentle gradient",
    lighting: "premium studio lighting, soft key light, subtle rim light",
    mood: "calm, confident, approachable",
    framing: "head-and-shoulders, LinkedIn-safe crop, centered composition",
    promptTemplate:
      "Ultra-realistic professional LinkedIn headshot of the same person from the uploaded reference photos, natural human skin texture, realistic eyes, accurate facial identity, premium studio lighting, 85mm portrait lens, shallow depth of field, professional posture, wearing [OUTFIT], background [BACKGROUND], expression confident and approachable, no plastic skin, no AI artifacts, no exaggerated beauty retouching, photorealistic, high-end corporate photography.",
    negativePrompt: DEFAULT_NEGATIVE_PROMPT,
  },
  {
    id: "startup-founder",
    name: "Startup Founder",
    description: "Clean, modern, slightly casual — confident but friendly.",
    outfit: "dark crewneck sweater or blazer, minimal accessories",
    background: "bright modern office blur, subtle bokeh",
    lighting: "soft daylight + gentle fill, natural look",
    mood: "energetic, optimistic, trustworthy",
    framing: "head-and-shoulders, slight 3/4 angle",
    promptTemplate:
      "Ultra-realistic professional LinkedIn headshot of the same person from the uploaded reference photos, natural human skin texture, realistic eyes, accurate facial identity, premium studio lighting, 85mm portrait lens, shallow depth of field, professional posture, wearing [OUTFIT], background [BACKGROUND], expression confident and approachable, no plastic skin, no AI artifacts, no exaggerated beauty retouching, photorealistic, high-end corporate photography.",
    negativePrompt: DEFAULT_NEGATIVE_PROMPT,
  },
  {
    id: "finance-professional",
    name: "Finance Professional",
    description: "High-trust, high-precision aesthetic — sharp and composed.",
    outfit: "charcoal suit, white shirt, conservative tie",
    background: "dark slate studio background, subtle gradient",
    lighting: "controlled studio lighting, clean catchlights",
    mood: "serious, competent, reliable",
    framing: "head-and-shoulders, straight-on",
    promptTemplate:
      "Ultra-realistic professional LinkedIn headshot of the same person from the uploaded reference photos, natural human skin texture, realistic eyes, accurate facial identity, premium studio lighting, 85mm portrait lens, shallow depth of field, professional posture, wearing [OUTFIT], background [BACKGROUND], expression confident and approachable, no plastic skin, no AI artifacts, no exaggerated beauty retouching, photorealistic, high-end corporate photography.",
    negativePrompt: DEFAULT_NEGATIVE_PROMPT,
  },
  {
    id: "lawyer",
    name: "Lawyer",
    description: "Traditional, authoritative, conservative tone.",
    outfit: "dark suit, white shirt, conservative tie",
    background: "warm neutral studio background, subtle texture",
    lighting: "classic portrait lighting, soft but defined",
    mood: "authoritative, calm, reassuring",
    framing: "head-and-shoulders, slightly off-center",
    promptTemplate:
      "Ultra-realistic professional LinkedIn headshot of the same person from the uploaded reference photos, natural human skin texture, realistic eyes, accurate facial identity, premium studio lighting, 85mm portrait lens, shallow depth of field, professional posture, wearing [OUTFIT], background [BACKGROUND], expression confident and approachable, no plastic skin, no AI artifacts, no exaggerated beauty retouching, photorealistic, high-end corporate photography.",
    negativePrompt: DEFAULT_NEGATIVE_PROMPT,
  },
  {
    id: "medical-professional",
    name: "Medical Professional",
    description: "Clean, bright, clinical — calm and trustworthy.",
    outfit: "white coat over professional attire, minimal jewelry",
    background: "bright, clean clinic setting, softly blurred",
    lighting: "soft daylight, realistic reflections in eyes",
    mood: "warm, reassuring, competent",
    framing: "head-and-shoulders, gentle smile",
    promptTemplate:
      "Ultra-realistic professional LinkedIn headshot of the same person from the uploaded reference photos, natural human skin texture, realistic eyes, accurate facial identity, premium studio lighting, 85mm portrait lens, shallow depth of field, professional posture, wearing [OUTFIT], background [BACKGROUND], expression confident and approachable, no plastic skin, no AI artifacts, no exaggerated beauty retouching, photorealistic, high-end corporate photography.",
    negativePrompt: DEFAULT_NEGATIVE_PROMPT,
  },
  {
    id: "creative-professional",
    name: "Creative Professional",
    description: "Editorial feel — premium but expressive.",
    outfit: "smart casual, monochrome jacket or knit, tasteful accessories",
    background: "minimal studio background with subtle color wash",
    lighting: "soft editorial lighting, gentle contrast",
    mood: "confident, artistic, approachable",
    framing: "head-and-shoulders, slight angle, natural expression",
    promptTemplate:
      "Ultra-realistic professional LinkedIn headshot of the same person from the uploaded reference photos, natural human skin texture, realistic eyes, accurate facial identity, premium studio lighting, 85mm portrait lens, shallow depth of field, professional posture, wearing [OUTFIT], background [BACKGROUND], expression confident and approachable, no plastic skin, no AI artifacts, no exaggerated beauty retouching, photorealistic, high-end corporate photography.",
    negativePrompt: DEFAULT_NEGATIVE_PROMPT,
  },
  {
    id: "real-estate-agent",
    name: "Real Estate Agent",
    description: "Bright, friendly, high-trust portrait for client-facing roles.",
    outfit: "tailored blazer, crisp shirt, subtle jewelry",
    background: "bright modern interior, softly blurred",
    lighting: "natural daylight look, clean catchlights",
    mood: "friendly, confident, welcoming",
    framing: "head-and-shoulders, open posture",
    promptTemplate:
      "Ultra-realistic professional LinkedIn headshot of the same person from the uploaded reference photos, natural human skin texture, realistic eyes, accurate facial identity, premium studio lighting, 85mm portrait lens, shallow depth of field, professional posture, wearing [OUTFIT], background [BACKGROUND], expression confident and approachable, no plastic skin, no AI artifacts, no exaggerated beauty retouching, photorealistic, high-end corporate photography.",
    negativePrompt: DEFAULT_NEGATIVE_PROMPT,
  },
  {
    id: "speaker-media-kit",
    name: "Speaker / Media Kit",
    description: "High-polish portrait with stage-ready presence.",
    outfit: "premium blazer, open collar, modern watch",
    background: "dark background with subtle stage bokeh lights",
    lighting: "dramatic but realistic key light, premium contrast",
    mood: "commanding, charismatic, approachable",
    framing: "head-and-shoulders, confident posture",
    promptTemplate:
      "Ultra-realistic professional LinkedIn headshot of the same person from the uploaded reference photos, natural human skin texture, realistic eyes, accurate facial identity, premium studio lighting, 85mm portrait lens, shallow depth of field, professional posture, wearing [OUTFIT], background [BACKGROUND], expression confident and approachable, no plastic skin, no AI artifacts, no exaggerated beauty retouching, photorealistic, high-end corporate photography.",
    negativePrompt: DEFAULT_NEGATIVE_PROMPT,
  },
];

