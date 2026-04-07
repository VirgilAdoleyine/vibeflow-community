import { Annotation } from "@langchain/langgraph";
import type { StructuredToolInterface } from "@langchain/core/tools";

export const AgentStateAnnotation = Annotation.Root({
  user_prompt: Annotation<string>(),
  thread_id: Annotation<string>(),
  user_api_key: Annotation<string | null>({
    reducer: (_, b) => b,
    default: () => null,
  }),
  is_free_tier: Annotation<boolean>({
    reducer: (_, b) => b ?? false,
    default: () => false,
  }),

  // Planning
  plan: Annotation<string[]>({
    reducer: (_, b) => b ?? [],
    default: () => [],
  }),
  current_step: Annotation<number>({
    reducer: (_, b) => b ?? 0,
    default: () => 0,
  }),

  // Execution
  current_script: Annotation<string>({
    reducer: (_, b) => b ?? "",
    default: () => "",
  }),
  sandbox_result: Annotation<unknown>({
    reducer: (_, b) => b,
    default: () => null,
  }),

  // Output
  final_output: Annotation<string>({
    reducer: (_, b) => b ?? "",
    default: () => "",
  }),

  // Error handling & self-healing
  error: Annotation<string | null>({
    reducer: (_, b) => b,
    default: () => null,
  }),
  retry_count: Annotation<number>({
    reducer: (_, b) => b ?? 0,
    default: () => 0,
  }),

  // Auth tokens fetched from Nango
  integration_tokens: Annotation<Record<string, string>>({
    reducer: (a, b) => ({ ...a, ...b }),
    default: () => ({}),
  }),

  // Retrieved from pgvector memory
  memory_context: Annotation<string>({
    reducer: (_, b) => b ?? "",
    default: () => "",
  }),

  // Composio tools for connected apps
  composio_tools: Annotation<StructuredToolInterface[]>({
    reducer: (_, b) => b ?? [],
    default: () => [],
  }),
});

export type AgentState = typeof AgentStateAnnotation.State;
