import { getModel } from "@/lib/graph/factory";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { REFLECTOR_PROMPT } from "@/lib/prompts/reflector";
import { SYSTEM_PROMPT } from "@/lib/prompts/system";
import type { AgentState } from "@/lib/graph/state";

export async function reflectorNode(
  state: AgentState
): Promise<Partial<AgentState>> {
  const model = getModel("reflector", state.user_api_key, state.is_free_tier);
  console.log(
    `[reflector] Diagnosing error (attempt ${state.retry_count})...`
  );

  const response = await model.invoke([
    new SystemMessage(SYSTEM_PROMPT + "\n\n" + REFLECTOR_PROMPT),
    new HumanMessage(
      `Failed script:\n\`\`\`python\n${state.current_script}\n\`\`\`\n\nError:\n${state.error}\n\nOriginal task: ${state.plan[state.current_step] || state.user_prompt}\n\nDiagnose the issue and provide a fixed script:`
    ),
  ]);

  const content = response.content as string;

  // Extract the fixed script
  const codeMatch = content.match(/```python\n?([\s\S]*?)\n?```/);
  const fixedScript = codeMatch ? codeMatch[1] : state.current_script;

  // Extract diagnosis
  const diagnosisMatch = content.match(/DIAGNOSIS:\s*(.*?)(?:\n|$)/);
  const diagnosis = diagnosisMatch
    ? diagnosisMatch[1]
    : "Script had an error, attempting fix";

  console.log(`[reflector] Diagnosis: ${diagnosis}`);
  console.log(`[reflector] Patched script, re-routing to executor`);

  return {
    current_script: fixedScript,
    error: null, // clear error so executor can retry
  };
}
