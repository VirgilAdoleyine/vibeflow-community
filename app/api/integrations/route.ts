import { NextRequest, NextResponse } from "next/server";
import { getConnectedProviders } from "@/lib/integrations/client";
import { getCurrentUserId } from "@/lib/auth/user";
import { getComposioSession } from "@/lib/integrations/composio";
import { SUPPORTED_INTEGRATIONS } from "@/types/integration";

export const runtime = "nodejs";

export async function GET(_req: NextRequest) {
  const userId = await getCurrentUserId();
  
  let connectedProviders: string[] = [];
  
  if (userId) {
    try {
      const session = await getComposioSession(userId);
      connectedProviders = session?.connectedApps || [];
    } catch (err) {
      console.error("[api/integrations] Session error:", err);
    }
  }
  
  return NextResponse.json({
    integrations: SUPPORTED_INTEGRATIONS.map((i) => ({
      ...i,
      status: connectedProviders.includes(i.provider) ? "connected" : "disconnected",
    })),
  });
}
