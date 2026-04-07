import { NextRequest, NextResponse } from "next/server";
import { createUser, getUserByEmail } from "@/lib/db/user";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { email, password, openrouter_api_key } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const existing = await getUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      );
    }

    const user = await createUser({ email, password, openrouter_api_key });

    return NextResponse.json({
      user: { id: user.id, email: user.email },
    });
  } catch (err) {
    console.error("[auth/signup] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
