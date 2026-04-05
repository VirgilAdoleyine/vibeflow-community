import { Nango } from "@nangohq/node";

let _client: Nango | null = null;

export function getNangoClient(): Nango {
  if (!_client) {
    const secretKey = process.env.NANGO_SECRET_KEY;
    if (!secretKey) {
      throw new Error("NANGO_SECRET_KEY is not set");
    }
    _client = new Nango({ secretKey });
  }
  return _client;
}

/**
 * List all active connections for a given user (connection_id = user_id in our setup).
 */
export async function listConnections(userId: string) {
  try {
    const nango = getNangoClient();
    const response = await nango.listConnections();
    // Filter to this user's connections
    const connections = (response as { configs?: unknown[] })?.configs ?? [];
    return connections.filter(
      (c: unknown) =>
        typeof c === "object" &&
        c !== null &&
        "connection_id" in c &&
        (c as { connection_id: string }).connection_id === userId
    );
  } catch (err) {
    console.error("[nango] Failed to list connections:", err);
    return [];
  }
}

/**
 * Trigger an OAuth flow for a given provider.
 * Returns the Nango auth URL to redirect the user to.
 */
export function getAuthUrl(
  provider: string,
  userId: string,
  publicKey: string
): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  // Nango's frontend SDK handles this — we just build the URL
  return `https://api.nango.dev/oauth/connect/${provider}?public_key=${publicKey}&connection_id=${userId}&redirect_uri=${appUrl}/api/nango/callback`;
}

/**
 * Delete (disconnect) a Nango connection.
 */
export async function deleteConnection(
  provider: string,
  userId: string
): Promise<void> {
  const nango = getNangoClient();
  await nango.deleteConnection(provider, userId);
}
