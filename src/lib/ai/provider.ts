import { getServerEnv } from "@/lib/env";
import type { HeadshotProvider } from "@/lib/ai/providers/base";
import { MockHeadshotProvider } from "@/lib/ai/providers/mock";
import { OpenAIHeadshotProvider } from "@/lib/ai/providers/openai";
import { ReplicateHeadshotProvider } from "@/lib/ai/providers/replicate";
import { FalHeadshotProvider } from "@/lib/ai/providers/fal";

export function getHeadshotProvider(): HeadshotProvider {
  const env = getServerEnv();
  const provider = (env.AI_PROVIDER ?? "mock").toLowerCase();
  switch (provider) {
    case "replicate":
      return new ReplicateHeadshotProvider();
    case "fal":
      return new FalHeadshotProvider();
    case "openai":
      return new OpenAIHeadshotProvider();
    case "mock":
    default:
      return new MockHeadshotProvider();
  }
}

