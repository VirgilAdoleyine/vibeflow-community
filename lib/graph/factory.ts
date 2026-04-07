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

  // PAID TIER - Multi-model routing
  const models: Record<Role, string> = {
    // Claude: Primary for code generation from NLP
    planner: "anthropic/claude-sonnet-4.6",
    executor: "anthropic/claude-sonnet-4.6",
    
    // Gemini: Validation, optimization, large context checks
    // Also for UI/image/video analysis and Google ecosystem
    reflector: "google/gemini-3.1-pro-preview",
    
    // Claude: Fast formatting
    formatter: "anthropic/claude-haiku-3.5",
  };

  const modelConfig: Record<Role, { temperature: number; maxTokens?: number }> = {
    planner: { temperature: 0 },
    executor: { temperature: 0.2 },
    reflector: { temperature: 0.1, maxTokens: 8192 },
    formatter: { temperature: 0 },
  };

  const isGemini = role === "reflector";

  return new ChatOpenAI({
    modelName: models[role],
    configuration: {
      baseURL: isGemini 
        ? "https://generativelanguage.googleapis.com/v1beta/openai/"
        : "https://openrouter.ai/api/v1",
      apiKey: isGemini 
        ? process.env.GEMINI_API_KEY 
        : userApiKey,
      defaultHeaders: {
        "HTTP-Referer": "https://vibeflow.ai",
        "X-Title": "VibeFlow",
      },
    },
    maxTokens: modelConfig[role].maxTokens,
    temperature: modelConfig[role].temperature,
  });
}
