import { randomUUID } from "crypto";

import type {
  EnhancedImage,
  GenerateHeadshotsInput,
  GeneratedImage,
  HeadshotProvider,
  ModelRef,
  TrainIdentityInput,
} from "@/lib/ai/providers/base";

function svgFor({
  styleId,
  styleName,
  index,
}: {
  styleId: string;
  styleName: string;
  index: number;
}) {
  const title = `${styleName} • ${index + 1}`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1280" viewBox="0 0 1024 1280">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#111827"/>
      <stop offset="0.6" stop-color="#0b0f1a"/>
      <stop offset="1" stop-color="#000000"/>
    </linearGradient>
    <linearGradient id="p" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.20"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0.02"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1280" fill="url(#g)"/>
  <rect x="64" y="64" width="896" height="1152" rx="56" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.10)"/>

  <!-- "Photo" area -->
  <rect x="112" y="140" width="800" height="960" rx="44" fill="url(#p)" stroke="rgba(255,255,255,0.12)"/>
  <circle cx="512" cy="500" r="170" fill="rgba(0,0,0,0.22)"/>
  <path d="M 312 880 C 360 760 440 700 512 700 C 584 700 664 760 712 880 L 712 1030 L 312 1030 Z" fill="rgba(0,0,0,0.22)"/>

  <!-- LinkedIn crop guides -->
  <rect x="212" y="240" width="600" height="760" rx="38" fill="none" stroke="rgba(255,255,255,0.16)" stroke-dasharray="10 10"/>

  <!-- Top label -->
  <rect x="120" y="92" width="260" height="44" rx="22" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.12)"/>
  <text x="250" y="121" text-anchor="middle" font-family="ui-sans-serif, system-ui" font-size="16" fill="rgba(255,255,255,0.80)" font-weight="600">
    LinkedIn crop
  </text>

  <!-- Bottom caption -->
  <text x="512" y="1160" text-anchor="middle" font-family="ui-sans-serif, system-ui" font-size="28" fill="rgba(255,255,255,0.86)" font-weight="650">
    ${title}
  </text>
  <text x="512" y="1202" text-anchor="middle" font-family="ui-sans-serif, system-ui" font-size="16" fill="rgba(255,255,255,0.52)">
    Demo placeholder • style_id: ${styleId}
  </text>
</svg>`;
}

export class MockHeadshotProvider implements HeadshotProvider {
  name = "mock";

  async trainIdentityModel(_input: TrainIdentityInput): Promise<ModelRef> {
    void _input;
    return { provider: this.name, id: `mock-model-${randomUUID()}` };
  }

  async generateHeadshots(input: GenerateHeadshotsInput): Promise<GeneratedImage[]> {
    const images: GeneratedImage[] = [];
    for (const styleId of input.selectedStyleIds) {
      for (let i = 0; i < input.imagesPerStyle; i++) {
        const id = randomUUID();
        images.push({
          id,
          storageBucket: "outputs",
          storagePath: `${input.userId}/${input.jobId}/${styleId}/${id}.svg`,
          width: 1024,
          height: 1280,
        });
      }
    }
    return images;
  }

  async enhanceImage(input: { image: GeneratedImage }): Promise<EnhancedImage> {
    return input.image;
  }

  static renderSvg(styleId: string, index: number) {
    return svgFor({ styleId, styleName: styleId, index });
  }

  static renderSvgWithName(styleId: string, styleName: string, index: number) {
    return svgFor({ styleId, styleName, index });
  }
}
