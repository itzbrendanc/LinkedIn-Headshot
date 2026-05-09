export type ModelRef = {
  provider: string;
  id: string;
};

export type GeneratedImage = {
  id: string;
  storageBucket: string;
  storagePath: string;
  width?: number;
  height?: number;
  sourceUrl?: string;
  contentType?: string;
  generationSeed?: string;
};

export type EnhanceInput = {
  image: GeneratedImage;
};

export type EnhancedImage = GeneratedImage;

export type TrainIdentityInput = {
  userId: string;
  inputImagePaths: string[];
};

export type GenerateHeadshotsInput = {
  userId: string;
  jobId: string;
  selectedStyleIds: string[];
  stylePresets: Array<{
    id: string;
    name: string;
    outfit: string;
    background: string;
    lighting: string;
    mood: string;
    framing: string;
    promptTemplate: string;
    negativePrompt: string;
  }>;
  referenceImageUrls: string[];
  imagesPerStyle: number;
};

export interface HeadshotProvider {
  name: string;
  trainIdentityModel(input: TrainIdentityInput): Promise<ModelRef>;
  generateHeadshots(input: GenerateHeadshotsInput): Promise<GeneratedImage[]>;
  enhanceImage(input: EnhanceInput): Promise<EnhancedImage>;
}
