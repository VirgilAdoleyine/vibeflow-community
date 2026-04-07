import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserByEmail, verifyPassword, createSessionToken, verifySessionToken, getUserById } from "@/lib/db/user";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const user = await getUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const sessionToken = createSessionToken({ id: user.id, email: user.email });

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        openrouter_api_key: user.openrouter_api_key,
      },
    });

    response.cookies.set("session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("[auth/signin] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(_req: NextRequest) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session")?.value;

  if (!sessionCookie) {
    return NextResponse.json({ user: null });
  }

  const payload = verifySessionToken(sessionCookie);
  if (!payload) {
    return NextResponse.json({ user: null });
  }

  const user = await getUserById(payload.id);
  if (!user) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      openrouter_api_key: user.openrouter_api_key,
    },
  });
}
