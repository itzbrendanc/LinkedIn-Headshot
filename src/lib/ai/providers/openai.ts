import type {
  EnhanceInput,
  EnhancedImage,
  GenerateHeadshotsInput,
  GeneratedImage,
  HeadshotProvider,
  ModelRef,
  TrainIdentityInput,
} from "@/lib/ai/providers/base";

export class OpenAIHeadshotProvider implements HeadshotProvider {
  name = "openai";

  async trainIdentityModel(_input: TrainIdentityInput): Promise<ModelRef> {
    void _input;
    throw new Error("OpenAI provider not implemented yet. Use AI_PROVIDER=mock for MVP.");
  }

  async generateHeadshots(_input: GenerateHeadshotsInput): Promise<GeneratedImage[]> {
    void _input;
    throw new Error("OpenAI provider not implemented yet. Use AI_PROVIDER=mock for MVP.");
  }

  async enhanceImage(_input: EnhanceInput): Promise<EnhancedImage> {
    void _input;
    throw new Error("OpenAI provider not implemented yet. Use AI_PROVIDER=mock for MVP.");
  }
}
