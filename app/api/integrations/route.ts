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

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { provider } = await params;
  if (!provider) {
    return NextResponse.json({ error: "provider is required" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  if (!provider) {
    return NextResponse.json({ error: "provider is required" }, { status: 400 });
  }

  try {
    await deleteConnection(provider, "");
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(`[api/integrations] Failed to delete connection for ${provider}:`, err);
    return NextResponse.json(
      { error: "Failed to disconnect integration" },
      { status: 500 }
    );
  }
}