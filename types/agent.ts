export type AgentStage =
  | "idle"
  | "planning"
  | "executing"
  | "reflecting"
  | "formatting"
  | "done"
  | "error";

export interface AgentState {
  user_prompt: string;
  thread_id: string;
  plan: string[];
  current_step: number;
  current_script: string;
  sandbox_result: unknown;
  final_output: string;
  error: string | null;
  retry_count: number;
  integration_tokens: Record<string, string>;
  memory_context: string;
  composio_session_id?: string;
  active_apps: string[];
}

export interface AgentStreamEvent {
  stage: AgentStage;
  message: string;
  detail?: string;
  output?: unknown;
  plan?: string[];
  script?: string;
  error?: string;
}

export interface PlanStep {
  index: number;
  description: string;
  integration?: string;
  action: string;
}
