import { NextRequest } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { graph } from "@/lib/graph";
import { fetchUserTokens } from "@/lib/integrations/token";
import { detectRequiredProviders } from "@/lib/integrations/token";
import { buildMemoryContext } from "@/lib/db/memory";
import { storeMemory } from "@/lib/db/memory";
import {
  createExecution,
  updateExecution,
  appendLog,
} from "@/lib/db/executions";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import type { AgentStreamEvent } from "@/types/agent";

const PROMPT_BLOCKLIST = [
  "rm -rf", "rm -f", "rm -r", "os.system", "subprocess", "sh ", "bash ", "chmod", "curl", "wget",
  "exec(", "eval(", "import os", "import subprocess", "import sh", "system("
];

// Optional: Upstash rate limiters (if configured)
let ratelimit: Ratelimit | null = null;
let freeTierLimit: Ratelimit | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  const redis = Redis.fromEnv();
  
  // Per-IP spam protection
  ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "10 m"), // 10 req / 10 min
    analytics: true,
  });

  // Daily free tier cap
  freeTierLimit = new Ratelimit({
    redis,
    limiter: Ratelimit.fixedWindow(5, "24 h"), // 5 req / 24 hours
    prefix: "ratelimit_free",
    analytics: true,
  });
}
export const runtime = "nodejs";
export const maxDuration = 300;

// Anonymous user ID for demo mode (no auth required)
const DEMO_USER_ID = "demo-user";

function encode(event: AgentStreamEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export async function POST(req: NextRequest) {
  const { prompt, threadId: existingThreadId } = await req.json();

  if (!prompt?.trim()) {
    return new Response(JSON.stringify({ error: "prompt is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Security: Prompt blocklist
  const normalizedPrompt = prompt.toLowerCase();
  if (PROMPT_BLOCKLIST.some(term => normalizedPrompt.includes(term))) {
    return new Response(JSON.stringify({ error: "Security violation: Blocked command detected in prompt" }), {
      status: 200, // Return 200 with error JSON instead of 403
      headers: { "Content-Type": "application/json" },
    });
  }

  // Rate Limiting (per IP)
  if (ratelimit) {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const { success, limit, reset, remaining } = await ratelimit.limit(ip);
    
    if (!success) {
      return new Response(JSON.stringify({ error: `Rate limit exceeded. Try again after ${new Date(reset).toLocaleTimeString()}.` }), {
        status: 200, // Return 200 with error JSON instead of 429
        headers: {
          "Content-Type": "application/json",
          "X-RateLimit-Limit": limit.toString(),
          "X-RateLimit-Remaining": remaining.toString(),
          "X-RateLimit-Reset": reset.toString(),
        },
      });
    }
  }
  const userId = DEMO_USER_ID;
  const threadId = existingThreadId ?? uuidv4();

  // BYOK: Read user's API key from header
  const userApiKey = req.headers.get("x-user-api-key");
  const isFreeTier = !userApiKey;

  // Free Tier usage tracking (Vercel KV)
  if (isFreeTier && freeTierLimit) {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const { success } = await freeTierLimit.limit(ip);
    
    if (!success) {
      return new Response(JSON.stringify({ 
        error: "Free tier limit reached. Please add an OpenRouter API key in settings to continue." 
      }), {
        status: 200, // Return 200 with error JSON instead of 429
        headers: { "Content-Type": "application/json" },
      });
    }
  }
  // Create execution record (best-effort — skip if no DB)
  let executionId: string | null = null;
  try {
    const execution = await createExecution({
      user_id: userId,
      thread_id: threadId,
      prompt,
    });
    executionId = execution.id;
  } catch {
    // DB not configured — continue in stateless mode
  }

  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const encoder = new TextEncoder();

  const send = async (event: AgentStreamEvent) => {
    await writer.write(encoder.encode(encode(event)));
  };

  // Run the agent in the background, streaming events back
  (async () => {
    try {
      await send({ stage: "planning", message: "Breaking down your request…" });

      if (executionId) {
        await updateExecution(executionId, { status: "running", stage: "planning" });
        await appendLog({ executionId, stage: "planning", message: "Started", detail: prompt });
      }

      // Fetch tokens for detected integrations
      const providers = detectRequiredProviders(prompt);
      const tokens = await fetchUserTokens(userId).catch(() => ({}));
      const memoryContext = await buildMemoryContext(userId, providers).catch(() => "");

      // Stream graph events
      const eventStream = graph.streamEvents(
        { 
          user_prompt: prompt, 
          thread_id: threadId, 
          integration_tokens: tokens, 
          memory_context: memoryContext,
          user_api_key: userApiKey,
          is_free_tier: isFreeTier
        },
        { version: "v2" }
      );

      let lastScript = "";

      for await (const event of eventStream) {
        const { event: eventType, name, data } = event;

        if (eventType === "on_chain_start") {
          if (name === "planner") {
            await send({ stage: "planning", message: "Mapping out the steps…" });
          } else if (name === "executor") {
            await send({ stage: "executing", message: "Writing and running code in sandbox…" });
            if (executionId) await updateExecution(executionId, { stage: "executing" });
          } else if (name === "reflector") {
            await send({ stage: "reflecting", message: "Script failed — diagnosing and patching…" });
            if (executionId) await updateExecution(executionId, { stage: "reflecting" });
          } else if (name === "formatter") {
            await send({ stage: "formatting", message: "Packaging results…" });
          }
        }

        if (eventType === "on_chain_end") {
          const output = data?.output;

          if (name === "planner" && output?.plan) {
            await send({
              stage: "planning",
              message: `Plan ready — ${output.plan.length} step${output.plan.length > 1 ? "s" : ""}`,
              plan: output.plan,
            });
          }

          if (name === "executor") {
            if (output?.current_script) lastScript = output.current_script;
            if (output?.sandbox_result && !output?.error) {
              await send({
                stage: "executing",
                message: "Step complete",
                output: output.sandbox_result,
                script: output.current_script,
              });
            }
          }

          if (name === "reflector") {
            await send({ stage: "reflecting", message: "Fix applied, retrying…" });
          }

          if (name === "formatter" && output?.final_output) {
            await send({
              stage: "done",
              message: output.final_output,
              output: output.sandbox_result,
              script: lastScript,
            });

            if (executionId) {
              await updateExecution(executionId, {
                status: "success",
                stage: "done",
                output: output.final_output,
                script: lastScript,
                completed_at: new Date(),
              });
            }

            // Store successful script in memory
            if (lastScript && providers.length > 0) {
              await storeMemory({
                userId,
                provider: providers[0],
                endpoint: prompt.slice(0, 80),
                scriptTemplate: lastScript,
              }).catch(() => {});
            }
          }
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      await send({ stage: "error", message: "Something went wrong", error: message });

      if (executionId) {
        await updateExecution(executionId, {
          status: "failed",
          stage: "error",
          error: message,
          completed_at: new Date(),
        }).catch(() => {});
      }
    } finally {
      await writer.close();
    }
  })();

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Thread-Id": threadId,
      ...(executionId ? { "X-Execution-Id": executionId } : {}),
    },
  });
}
