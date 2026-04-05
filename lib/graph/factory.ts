import { ChatOpenAI } from "@langchain/openai";

export type Role = "planner" | "executor" | "reflector" | "formatter";

export function getModel(role: Role, userApiKey: string | null = null, isFreeTier: boolean = false) {
  // 1. FREE TIER (your key + locked model)
  if (isFreeTier || !userApiKey) {
    return new ChatOpenAI({
      modelName: "openrouter/free", // Locked for free tier
      configuration: {
        baseURL: "https://openrouter.ai/api/v1",
      },
      apiKey: process.env.OPENROUTER_API_KEY,
      temperature: role === "executor" ? 0.2 : 0, // executor needs a little creativity
    });
  }

  // 2. PAID TIER (user's key + their preferred models)
  const models: Record<Role, string> = {
    planner: "anthropic/claude-3.5-haiku:beta", // fast + cost effective
    executor: "anthropic/claude-3.5-sonnet:beta", // strongest code gen
    reflector: "anthropic/claude-3.5-sonnet:beta", // reasoning for bugs
    formatter: "anthropic/claude-3.5-haiku:beta", // lightweight formatting
  };

  return new ChatOpenAI({
    modelName: models[role],
    configuration: {
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": "https://vibeflow.ai",
        "X-Title": "VibeFlow",
      },
    },
    apiKey: userApiKey,
    temperature: role === "executor" ? 0.2 : 0,
  });
}
