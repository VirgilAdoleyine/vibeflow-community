import sql from "./client";
import type {
  Execution,
  ExecutionLog,
  CreateExecutionInput,
  UpdateExecutionInput,
} from "@/types/execution";

// ─── Executions ──────────────────────────────────────────────────────────────

export async function createExecution(
  input: CreateExecutionInput
): Promise<Execution> {
  const rows = await sql`
    INSERT INTO executions (user_id, thread_id, prompt, status, stage)
    VALUES (${input.user_id}, ${input.thread_id}, ${input.prompt}, 'pending', 'idle')
    RETURNING *
  ` as unknown as Execution[];
  return rows[0];
}

export async function getExecution(id: string): Promise<Execution | null> {
  const rows = await sql`
    SELECT * FROM executions WHERE id = ${id} LIMIT 1
  ` as unknown as Execution[];
  return rows[0] ?? null;
}

export async function updateExecution(
  id: string,
  input: UpdateExecutionInput
): Promise<void> {
  const sets: Record<string, unknown> = {};
  if (input.status !== undefined) sets.status = input.status;
  if (input.stage !== undefined) sets.stage = input.stage;
  if (input.output !== undefined) sets.output = input.output;
  if (input.error !== undefined) sets.error = input.error;
  if (input.script !== undefined) sets.script = input.script;
  if (input.completed_at !== undefined)
    sets.completed_at = input.completed_at.toISOString();

  // Build dynamic update — Neon's tagged template doesn't support dynamic keys
  // so we use individual updates per changed field
  await sql`
    UPDATE executions SET
      status       = COALESCE(${input.status ?? null}, status),
      stage        = COALESCE(${input.stage ?? null}, stage),
      output       = COALESCE(${input.output ?? null}, output),
      error        = COALESCE(${input.error ?? null}, error),
      script       = COALESCE(${input.script ?? null}, script),
      completed_at = COALESCE(${input.completed_at?.toISOString() ?? null}::timestamptz, completed_at)
    WHERE id = ${id}
  `;
}

export async function listExecutions(
  userId: string,
  limit = 20
): Promise<Execution[]> {
  const rows = await sql`
    SELECT * FROM executions
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;
  return rows as unknown as Execution[];
}

export async function listExecutionsBySession(
  sessionId: string,
  userId: string,
  limit = 50
): Promise<Execution[]> {
  const rows = await sql`
    SELECT * FROM executions
    WHERE thread_id = ${sessionId} AND user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;
  return rows as unknown as Execution[];
}

// ─── Execution Logs ──────────────────────────────────────────────────────────

export async function appendLog(params: {
  executionId: string;
  stage: string;
  message: string;
  detail?: string;
}): Promise<void> {
  await sql`
    INSERT INTO execution_logs (execution_id, stage, message, detail)
    VALUES (${params.executionId}, ${params.stage}, ${params.message}, ${params.detail ?? null})
  `;
}

export async function getExecutionLogs(
  executionId: string
): Promise<ExecutionLog[]> {
  const rows = await sql`
    SELECT * FROM execution_logs
    WHERE execution_id = ${executionId}
    ORDER BY created_at ASC
  `;
  return rows as unknown as ExecutionLog[];
}
