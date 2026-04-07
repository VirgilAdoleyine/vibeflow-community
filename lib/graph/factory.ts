import { ChatOpenAI } from "@langchain/openai";

export type Role = "planner" | "executor" | "reflector" | "formatter";

export function getModel(role: Role, userApiKey: string | null = null, isFreeTier: boolean = false) {
  // FREE TIER - locked model
  if (isFreeTier || !userApiKey) {
    return new ChatOpenAI({
      modelName: "openrouter/free",
      configuration: {
        baseURL: "https://openrouter.ai/api/v1",
      },
      apiKey: process.env.OPENROUTER_API_KEY,
      temperature: role === "executor" ? 0.2 : 0,
    });
  }

  // PAID TIER - All via OpenRouter with single API key
  const models: Record<Role, string> = {
    // Claude Sonnet 4.6: Primary for code generation from NLP
    planner: "anthropic/claude-sonnet-4-20250514",
    executor: "anthropic/claude-sonnet-4-20250514",
    
    // Gemini 3.1 Pro: Validation, optimization, large context, Google ecosystem
    reflector: "google/gemini-3.1-pro-preview",
    
    // Claude Haiku: Fast formatting
    formatter: "anthropic/claude-haiku-3.5",
  };

  const modelConfig: Record<Role, { temperature: number; maxTokens?: number }> = {
    planner: { temperature: 0 },
    executor: { temperature: 0.2 },
    reflector: { temperature: 0.1, maxTokens: 8192 },
    formatter: { temperature: 0 },
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
    maxTokens: modelConfig[role].maxTokens,
    temperature: modelConfig[role].temperature,
  });
}
