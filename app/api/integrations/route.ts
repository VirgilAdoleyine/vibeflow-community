import { NextRequest, NextResponse } from "next/server";
import { getConnectedProviders } from "@/lib/integrations/client";
import { getCurrentUserId } from "@/lib/auth/user";
import { SUPPORTED_INTEGRATIONS } from "@/types/integration";

export const runtime = "nodejs";

export async function GET(_req: NextRequest) {
  const userId = await getCurrentUserId();
  const connectedProviders = userId ? await getConnectedProviders(userId) : [];
  
  return NextResponse.json({
    integrations: SUPPORTED_INTEGRATIONS.map((i) => ({
      ...i,
      status: connectedProviders.includes(i.provider) ? "connected" : "disconnected",
    })),
  });
}
