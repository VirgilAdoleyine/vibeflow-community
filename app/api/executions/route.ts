import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth/user";
import { listExecutions, listExecutionsBySession } from "@/lib/db/executions";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");

  const executions = sessionId 
    ? await listExecutionsBySession(sessionId, userId)
    : await listExecutions(userId);
    
  return NextResponse.json({ executions });
}
