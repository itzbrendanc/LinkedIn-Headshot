export const PROMPT_VERSIONS = {
  v1_ultra_realistic_linkedin: "v1_ultra_realistic_linkedin",
} as const;

export type PromptVersion =
  (typeof PROMPT_VERSIONS)[keyof typeof PROMPT_VERSIONS];

export const DEFAULT_PROMPT_VERSION: PromptVersion =
  PROMPT_VERSIONS.v1_ultra_realistic_linkedin;

