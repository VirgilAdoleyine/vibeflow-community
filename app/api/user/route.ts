import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/user";
import { updateUserApiKey } from "@/lib/db/user";

export const runtime = "nodejs";

export async function GET(_req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      openrouter_api_key: user.openrouter_api_key,
    },
  });
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const { openrouter_api_key } = await req.json();
  
  if (openrouter_api_key && !openrouter_api_key.startsWith("sk-or-")) {
    return NextResponse.json({ error: "Invalid API key format" }, { status: 400 });
  }
  
  if (openrouter_api_key) {
    await updateUserApiKey(user.id, openrouter_api_key);
  }
  
  return NextResponse.json({ ok: true });
}
