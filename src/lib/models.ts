export type Provider = "openai" | "local" | "google";

export interface ModelConfig {
  id: string;
  name: string;
  provider: Provider;
}

export const AVAILABLE_MODELS: ModelConfig[] = [
  // OpenAI models
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "openai",
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "openai",
  },
  {
    id: "gpt-4-turbo",
    name: "GPT-4 Turbo",
    provider: "openai",
  },
  {
    id: "gpt-4",
    name: "GPT-4",
    provider: "openai",
  },
  {
    id: "gpt-3.5-turbo",
    name: "GPT-3.5 Turbo",
    provider: "openai",
  },
  // Local LM Studio models (will be dynamically discovered)
  // For now, we'll use a generic model ID that LM Studio typically uses
  {
    id: "openai/gpt-oss-20b",
    name: "GPT-OSS 20B",
    provider: "local",
  },

  {
    id: "gemini-3-pro-preview",
    name: "Gemini 3 Pro Preview",
    provider: "google",
  },
];

export const DEFAULT_MODEL: ModelConfig =
  AVAILABLE_MODELS[AVAILABLE_MODELS.length - 1];

export function getModelById(id: string): ModelConfig | undefined {
  return AVAILABLE_MODELS.find((model) => model.id === id);
}

export function getModelsByProvider(provider: Provider): ModelConfig[] {
  return AVAILABLE_MODELS.filter((model) => model.provider === provider);
}
