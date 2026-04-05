import { getModel } from "@/lib/graph/factory";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { AgentState } from "@/lib/graph/state";

const FORMAT_PROMPT = `You are a concise results communicator.
Convert technical script output into a clear, human-readable summary.

Rules:
- Lead with what was accomplished (past tense action)
- Include specific numbers/names where relevant
- Flag any warnings or partial failures
- Max 3 sentences
- Never mention "Python", "script", "JSON", or technical internals
- Write as if reporting to a non-technical stakeholder`;

export async function formatterNode(
  state: AgentState
): Promise<Partial<AgentState>> {
  const model = getModel("formatter", state.user_api_key, state.is_free_tier);
  console.log("[formatter] Converting result to plain English...");

  const resultStr =
    typeof state.sandbox_result === "string"
      ? state.sandbox_result
      : JSON.stringify(state.sandbox_result, null, 2);

  const response = await model.invoke([
    new SystemMessage(FORMAT_PROMPT),
    new HumanMessage(
      `Original request: ${state.user_prompt}\n\nTechnical result:\n${resultStr.slice(0, 2000)}\n\nProvide a plain-English summary:`
    ),
  ]);

  const finalOutput = response.content as string;
  console.log(`[formatter] Output: ${finalOutput}`);

  return { final_output: finalOutput };
}
