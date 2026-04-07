import { NextRequest, NextResponse } from "next/server";
import { deleteConnection, isConnectionValid } from "@/lib/integrations/client";
import { getCurrentUserId } from "@/lib/auth/user";
import { SUPPORTED_INTEGRATIONS } from "@/types/integration";

export const runtime = "nodejs";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { provider } = await params;
  const known = SUPPORTED_INTEGRATIONS.map((i) => i.provider);
  if (!known.includes(provider)) {
    return NextResponse.json({ error: `Unknown provider: ${provider}` }, { status: 400 });
  }

  try {
    await deleteConnection(provider, userId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(`[api/integrations/${provider}] DELETE failed:`, err);
    return NextResponse.json(
      { error: "Failed to disconnect integration" },
      { status: 500 }
    );
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ valid: false });
  }

  const { provider } = await params;

  try {
    const valid = await isConnectionValid(provider, userId);
    return NextResponse.json({ valid });
  } catch (err) {
    console.error(`[api/integrations/${provider}] GET validity check failed:`, err);
    return NextResponse.json({ valid: false });
  }
}