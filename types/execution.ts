export type ExecutionStatus =
  | "pending"
  | "running"
  | "success"
  | "failed"
  | "waiting";

export interface Execution {
  id: string;
  user_id: string;
  thread_id: string;
  prompt: string;
  status: ExecutionStatus;
  stage: string;
  output: string | null;
  error: string | null;
  script: string | null;
  created_at: Date;
  updated_at: Date;
  completed_at: Date | null;
}

export interface ExecutionLog {
  id: string;
  execution_id: string;
  stage: string;
  message: string;
  detail: string | null;
  created_at: Date;
}

export interface CreateExecutionInput {
  user_id: string;
  thread_id: string;
  prompt: string;
}

export interface UpdateExecutionInput {
  status?: ExecutionStatus;
  stage?: string;
  output?: string;
  error?: string;
  script?: string;
  completed_at?: Date;
}
