import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth/user";
import { getComposioSession, createComposioSession, updateComposioSession } from "@/lib/integrations/composio";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const connectionId = searchParams.get("connectionId");
    const appName = searchParams.get("appName");
    const status = searchParams.get("status");
    const error = searchParams.get("error");

    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.redirect(new URL("/?error=unauthenticated", req.url));
    }

    if (error) {
      console.error("[api/integrations/composio/callback] Error:", error);
      return NextResponse.redirect(new URL(`/?error=integration_failed&message=${encodeURIComponent(error)}`, req.url));
    }

    if (status === "connected" && connectionId && appName) {
      let session = await getComposioSession(userId);
      if (session) {
        const existingApps = session.connectedApps || [];
        if (!existingApps.includes(appName)) {
          await updateComposioSession(userId, [...existingApps, appName]);
        }
      } else {
        await createComposioSession(userId, [appName]);
      }
      return NextResponse.redirect(new URL("/?success=integration_connected", req.url));
    }

    return NextResponse.redirect(new URL("/?error=unknown_status", req.url));
  } catch (err) {
    console.error("[api/integrations/composio/callback] Error:", err);
    return NextResponse.redirect(new URL("/?error=callback_failed", req.url));
  }
}
