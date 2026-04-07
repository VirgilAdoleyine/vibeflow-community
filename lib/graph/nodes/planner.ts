import { getModel } from "@/lib/graph/factory";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { getPlannerPrompt } from "@/lib/prompts/planner";
import { SYSTEM_PROMPT } from "@/lib/prompts/system";
import type { AgentState } from "@/lib/graph/state";

export async function plannerNode(
  state: AgentState
): Promise<Partial<AgentState>> {
  console.log("[planner] Building execution plan...");

  const model = getModel("planner", state.user_api_key, state.is_free_tier);
  
  // Get connected apps from composio_tools
  const connectedApps = state.composio_tools?.map((t: any) => t?.name).filter(Boolean) || [];
  const plannerPrompt = getPlannerPrompt(connectedApps);

  const response = await model.invoke([
    new SystemMessage(SYSTEM_PROMPT + "\n\n" + plannerPrompt),
    new HumanMessage(
      `User request: ${state.user_prompt}\n\nMemory context:\n${state.memory_context || "No previous executions found."}`
    ),
  ]);

  const content = response.content as string;

  // Parse the JSON plan from the model response
  let plan: string[] = [];
  try {
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[1]);
      plan = parsed.steps || parsed;
    } else {
      // Fallback: try to parse raw JSON
      const raw = JSON.parse(content);
      plan = raw.steps || raw;
    }
  } catch {
    // Fallback: split numbered lines
    plan = content
      .split("\n")
      .filter((l) => /^\d+\./.test(l.trim()))
      .map((l) => l.replace(/^\d+\.\s*/, "").trim());
  }

  if (plan.length === 0) {
    plan = [state.user_prompt]; // single-step fallback
  }

  console.log(`[planner] Generated ${plan.length} steps`);
  return { plan, current_step: 0, error: null };
}
