import sql from "./client";
import { getSession, updateSessionTitle } from "./sessions";

export async function updateSessionOnExecution(
  sessionId: string,
  prompt: string
): Promise<void> {
  if (!sessionId) return;
  
  // Update session title based on first prompt if it's default
  const session = await getSession(sessionId, "");
  if (session && session.title === "New Workflow") {
    const title = prompt.length > 50 ? prompt.slice(0, 50) + "..." : prompt;
    await updateSessionTitle(sessionId, title);
  }
}
