import { StateGraph, END } from "@langchain/langgraph";
import { AgentStateAnnotation } from "./state";
import { plannerNode } from "./nodes/planner";
import { executorNode } from "./nodes/executor";
import { reflectorNode } from "./nodes/reflector";
import { formatterNode } from "./nodes/formatter";
import type { AgentState } from "./state";

// ─── Routing logic ───────────────────────────────────────────────────────────

function routeAfterExecutor(state: AgentState): string {
  // Hard failure after 3 retries
  if (state.retry_count >= 3) {
    console.log("[router] Max retries reached, going to formatter");
    return "formatter";
  }

  // Error — route to reflector for self-healing
  if (state.error) {
    console.log("[router] Error detected, routing to reflector");
    return "reflector";
  }

  // More steps to execute
  if (state.current_step < state.plan.length) {
    console.log(
      `[router] Step ${state.current_step}/${state.plan.length}, continuing execution`
    );
    return "executor";
  }

  // All steps done
  console.log("[router] All steps complete, formatting output");
  return "formatter";
}

function routeAfterReflector(state: AgentState): string {
  // After reflection, always retry execution
  return "executor";
}

// ─── Build graph ─────────────────────────────────────────────────────────────

const builder = new StateGraph(AgentStateAnnotation);

builder
  .addNode("planner", plannerNode)
  .addNode("executor", executorNode)
  .addNode("reflector", reflectorNode)
  .addNode("formatter", formatterNode);

// Entry point
builder.addEdge("__start__", "planner");

// Planner always goes to executor
builder.addEdge("planner", "executor");

// Executor routes conditionally
builder.addConditionalEdges("executor", routeAfterExecutor, {
  executor: "executor",
  reflector: "reflector",
  formatter: "formatter",
});

// Reflector always retries execution
builder.addConditionalEdges("reflector", routeAfterReflector, {
  executor: "executor",
});

// Formatter is terminal
builder.addEdge("formatter", END);

// Compile without checkpointer for edge runtime compatibility
// Checkpointing is handled at the API route level via DB
export const graph = builder.compile();

export type { AgentState };
