import { NextRequest } from "next/server";
import { getNangoClient } from "@/lib/integrations/client";
import { SUPPORTED_INTEGRATIONS } from "@/types/integration";

export const runtime = "nodejs";

export async function GET(_req: NextRequest) {
  const userId = "demo-user";

  try {
    const nango = getNangoClient();
    const response = await nango.listConnections();
    const connections =
      (response as { configs?: { provider_config_key: string; connection_id: string }[] })
        ?.configs ?? [];

    const userConnections = connections
      .filter((c) => c.connection_id === userId)
      .map((c) => c.provider_config_key);

    const integrations = SUPPORTED_INTEGRATIONS.map((integration) => ({
      ...integration,
      status: userConnections.includes(integration.provider)
        ? "connected"
        : "disconnected",
    }));

    return new Response(JSON.stringify({ integrations }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    // Nango not configured — return all as disconnected
    const integrations = SUPPORTED_INTEGRATIONS.map((i) => ({
      ...i,
      status: "disconnected",
    }));
    return new Response(JSON.stringify({ integrations }), {
      headers: { "Content-Type": "application/json" },
    });
  }
}
