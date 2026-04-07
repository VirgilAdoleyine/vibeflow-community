import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth/user";
import { listExecutions } from "@/lib/db/executions";

export const runtime = "nodejs";

export async function GET(_req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const executions = await listExecutions(userId);
  return NextResponse.json({ executions });
}
