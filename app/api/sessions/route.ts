import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth/user";
import { createSession, listUserSessions, getSession } from "@/lib/db/sessions";

export const runtime = "nodejs";

export async function GET(_req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessions = await listUserSessions(userId);
  return NextResponse.json({ sessions });
}

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title } = await req.json();
  const session = await createSession(userId, title || "New Workflow");
  return NextResponse.json({ session });
}
