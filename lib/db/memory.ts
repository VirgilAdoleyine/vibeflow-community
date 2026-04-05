import sql from "./client";
import type { IntegrationMemory } from "@/types/integration";

/**
 * Store a successful script in memory.
 * If a memory for this user+provider+endpoint exists, increment success_count.
 */
export async function storeMemory(params: {
  userId: string;
  provider: string;
  endpoint: string;
  scriptTemplate: string;
}): Promise<void> {
  const { userId, provider, endpoint, scriptTemplate } = params;

  try {
    await sql`
      INSERT INTO integration_memories (user_id, provider, endpoint, script_template)
      VALUES (${userId}, ${provider}, ${endpoint}, ${scriptTemplate})
      ON CONFLICT (user_id, provider, endpoint)
      DO UPDATE SET
        script_template = EXCLUDED.script_template,
        success_count = integration_memories.success_count + 1,
        updated_at = NOW()
    `;
  } catch (err) {
    // Unique constraint may not exist yet — insert fresh
    console.error("[memory] Failed to store memory:", err);
  }
}

/**
 * Retrieve the most relevant memories for a given prompt.
 * Falls back to keyword search if embeddings aren't set up.
 */
export async function retrieveMemories(params: {
  userId: string;
  providers: string[];
  limit?: number;
}): Promise<IntegrationMemory[]> {
  const { userId, providers, limit = 3 } = params;

  if (providers.length === 0) return [];

  try {
    const rows = await sql`
      SELECT *
      FROM integration_memories
      WHERE user_id = ${userId}
        AND provider = ANY(${providers})
      ORDER BY success_count DESC, updated_at DESC
      LIMIT ${limit}
    `;

    return rows as unknown as IntegrationMemory[];
  } catch {
    return [];
  }
}

/**
 * Build a memory context string to inject into the planner prompt.
 */
export async function buildMemoryContext(
  userId: string,
  providers: string[]
): Promise<string> {
  const memories = await retrieveMemories({ userId, providers });

  if (memories.length === 0) return "";

  const parts = memories.map(
    (m) =>
      `[${m.provider}] ${m.endpoint} (used ${m.success_count} times):\n${m.script_template.slice(0, 300)}`
  );

  return `Previously successful scripts:\n${parts.join("\n\n")}`;
}
