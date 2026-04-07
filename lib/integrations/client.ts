import { getComposioSession } from "./composio";

export async function listConnectionsForUser(userId: string) {
  const session = await getComposioSession(userId);
  return session?.connectedApps || [];
}

export async function getConnectedProviders(userId: string): Promise<string[]> {
  const session = await getComposioSession(userId);
  return session?.connectedApps || [];
}

export async function isConnectionValid(
  provider: string,
  userId: string
): Promise<boolean> {
  const session = await getComposioSession(userId);
  return session?.connectedApps?.includes(provider) || false;
}

export async function deleteConnection(
  provider: string,
  userId: string
): Promise<void> {
  return;
}