import { Sandbox } from "e2b";

let activeSandbox: Sandbox | null = null;

/**
 * Get or create a warm E2B sandbox session.
 * Reuses an active sandbox within the same process to reduce cold starts.
 */
export async function getSandbox(): Promise<Sandbox> {
  if (activeSandbox) {
    try {
      // Ping to confirm sandbox is still alive
      await activeSandbox.commands.run("echo ok");
      return activeSandbox;
    } catch {
      activeSandbox = null;
    }
  }

  activeSandbox = await Sandbox.create({
    apiKey: process.env.E2B_API_KEY,
    timeoutMs: 30_000,
  });

  // Pre-install common packages once per session
  await activeSandbox.commands.run(
    "pip install requests python-dotenv --quiet 2>&1 | tail -1"
  );

  return activeSandbox;
}

/**
 * Close and release the active sandbox.
 * Call this when the workflow is fully complete.
 */
export async function closeSandbox(): Promise<void> {
  if (activeSandbox) {
    await activeSandbox.kill();
    activeSandbox = null;
  }
}
