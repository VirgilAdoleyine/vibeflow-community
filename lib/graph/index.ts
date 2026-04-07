import { StateGraph, END, START } from "@langchain/langgraph";
import { AgentStateAnnotation } from "./state";
import { plannerNode } from "./nodes/planner";
import { executorNode } from "./nodes/executor";
import { reflectorNode } from "./nodes/reflector";
import { formatterNode } from "./nodes/formatter";
import type { AgentState } from "./state";

type AgentGraphNodes = "planner" | "executor" | "reflector" | "formatter";

function routeAfterExecutor(state: AgentState): AgentGraphNodes {
  if (state.retry_count >= 3) {
    console.log("[router] Max retries reached, going to formatter");
    return "formatter";
  }

  if (state.error) {
    console.log("[router] Error detected, routing to reflector");
    return "reflector";
  }

  if (state.current_step < state.plan.length) {
    console.log(
      `[router] Step ${state.current_step}/${state.plan.length}, continuing execution`
    );
    return "executor";
  }

  console.log("[router] All steps complete, formatting output");
  return "formatter";
}

function routeAfterReflector(state: AgentState): AgentGraphNodes {
  return "executor";
}

const builder = new StateGraph<typeof AgentStateAnnotation.State>({
  annotation: AgentStateAnnotation,
  channels: AgentStateAnnotation,
} as any);

(builder as any)
  .addNode("planner", plannerNode)
  .addNode("executor", executorNode)
  .addNode("reflector", reflectorNode)
  .addNode("formatter", formatterNode);

(builder as any).addEdge(START, "planner");
(builder as any).addEdge("planner", "executor");
(builder as any).addConditionalEdges("executor", routeAfterExecutor, {
  executor: "executor",
  reflector: "reflector",
  formatter: "formatter",
});
(builder as any).addConditionalEdges("reflector", routeAfterReflector, {
  executor: "executor",
});
(builder as any).addEdge("formatter", END);

export const graph = (builder as any).compile();

export type { AgentState };