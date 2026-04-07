import sql from "./client";
import type { Session, CreateSessionInput } from "@/types/session";

export async function createSession(
  userId: string,
  title: string
): Promise<Session> {
  const rows = await sql`
    INSERT INTO sessions (user_id, title)
    VALUES (${userId}, ${title})
    RETURNING *
  ` as unknown as Session[];
  return rows[0];
}

export async function listUserSessions(
  userId: string,
  limit = 50
): Promise<Session[]> {
  const rows = await sql`
    SELECT * FROM sessions
    WHERE user_id = ${userId}
    ORDER BY updated_at DESC
    LIMIT ${limit}
  ` as unknown as Session[];
  return rows;
}

export async function getSession(
  id: string,
  userId: string
): Promise<Session | null> {
  const rows = await sql`
    SELECT * FROM sessions
    WHERE id = ${id} AND user_id = ${userId}
    LIMIT 1
  ` as unknown as Session[];
  return rows[0] ?? null;
}

export async function updateSessionTitle(
  id: string,
  title: string
): Promise<void> {
  await sql`
    UPDATE sessions SET title = ${title}, updated_at = NOW()
    WHERE id = ${id}
  `;
}

export async function updateSessionOnExecution(
  sessionId: string,
  prompt: string
): Promise<void> {
  if (!sessionId) return;
  
  const session = await getSession(sessionId, "");
  if (session && session.title === "New Workflow") {
    const title = prompt.length > 50 ? prompt.slice(0, 50) + "..." : prompt;
    await updateSessionTitle(sessionId, title);
  }
}
