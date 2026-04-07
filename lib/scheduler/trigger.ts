import { inngest } from "./client";
import { graph } from "@/lib/graph";
import { buildMemoryContext } from "@/lib/db/memory";
import {
  createExecution,
  updateExecution,
  appendLog,
} from "@/lib/db/executions";
import { v4 as uuidv4 } from "uuid";
import type { VibeFlowEvents } from "./client";

type AutomationRunEvent = VibeFlowEvents["automation/run"];
type AutomationScheduledEvent = VibeFlowEvents["automation/scheduled"];

export const runAutomation = inngest.createFunction(
  { id: "run-automation", triggers: { event: "automation/run" } },
  async ({ event, step }: { event: AutomationRunEvent; step: any }) => {
    const { userId, prompt, threadId, executionId } = event.data;

    await step.run("update-status-running", async () => {
      await updateExecution(executionId, { status: "running", stage: "planning" });
      await appendLog({
        executionId,
        stage: "planning",
        message: "Starting automation",
        detail: prompt,
      });
    });

    const tokens = await step.run("fetch-tokens", async () => {
      return {};
    });

    const memoryContext = await step.run("fetch-memory", async () => {
      const providers: string[] = [];
      return buildMemoryContext(userId, providers);
    });

    const result = await step.run("run-graph", async () => {
      const finalState = await graph.invoke({
        user_prompt: prompt,
        thread_id: threadId,
        integration_tokens: tokens,
        memory_context: memoryContext,
      });
      return finalState;
    });

    await step.run("save-result", async () => {
      const hasError = result.error && result.retry_count >= 3;
      await updateExecution(executionId, {
        status: hasError ? "failed" : "success",
        stage: "done",
        output: result.final_output,
        error: hasError ? result.error : undefined,
        script: result.current_script,
        completed_at: new Date(),
      });
    });

    return { executionId, output: result.final_output };
  }
);

export const runScheduledAutomation = inngest.createFunction(
  { id: "run-scheduled-automation", triggers: { event: "automation/scheduled" } },
  async ({ event, step }: { event: AutomationScheduledEvent; step: any }) => {
    const { userId, prompt, scheduleId } = event.data;
    const threadId = uuidv4();

    const execution = await step.run("create-execution", async () => {
      return createExecution({
        user_id: userId,
        thread_id: threadId,
        prompt,
      });
    });

    await step.sendEvent("trigger-run", {
      name: "automation/run",
      data: {
        userId,
        prompt,
        threadId,
        executionId: execution.id,
      },
    });

    return { scheduleId, executionId: execution.id };
  }
);

export const functions = [runAutomation, runScheduledAutomation];