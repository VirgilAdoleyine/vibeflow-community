import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth/user";
import {
  createComposioSession,
  authorizeApp,
  waitForConnection,
  disconnectApp,
  getComposioSession,
  clearSession,
  getAvailableTools,
} from "@/lib/integrations/composio";

export const runtime = "nodejs";

async function getUserId(): Promise<string> {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("User not authenticated");
  }
  return userId;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, apps, appName, callbackUrl } = body;

    const userId = await getUserId();

    if (action === "createSession") {
      const session = await createComposioSession(userId, apps || []);
      return NextResponse.json({
        sessionId: userId,
        connectedApps: session.connectedApps,
        toolCount: session.tools.length,
      });
    }

    if (action === "getTools") {
      const tools = await getAvailableTools(userId, apps);
      return NextResponse.json({
        tools: tools.map((t) => ({
          name: t.name,
          description: t.description,
        })),
      });
    }

    if (action === "authorize") {
      if (!appName) {
        return NextResponse.json(
          { error: "appName is required" },
          { status: 400 }
        );
      }

      const { redirectUrl, session } = await authorizeApp(
        userId,
        appName,
        callbackUrl
      );

      return NextResponse.json({
        redirectUrl,
        pendingConnection: true,
      });
    }

    if (action === "connect") {
      const existingSession = await getComposioSession(userId);
      if (!existingSession) {
        return NextResponse.json(
          { error: "No pending connection" },
          { status: 400 }
        );
      }

      const connection = await waitForConnection(existingSession);
      return NextResponse.json({
        connected: true,
        connection,
      });
    }

    if (action === "disconnect") {
      if (!appName) {
        return NextResponse.json(
          { error: "appName is required" },
          { status: 400 }
        );
      }

      await disconnectApp(userId, appName);
      return NextResponse.json({ disconnected: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("[api/integrations/composio] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(_req: NextRequest) {
  try {
    const userId = await getUserId();
    const session = await getComposioSession(userId);

    if (!session) {
      return NextResponse.json({
        connectedApps: [],
        tools: [],
      });
    }

    return NextResponse.json({
      connectedApps: session.connectedApps,
      toolCount: session.tools.length,
    });
  } catch (err) {
    console.error("[api/integrations/composio] GET Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
