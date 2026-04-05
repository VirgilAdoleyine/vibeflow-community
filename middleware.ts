import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const waitlistSecret = process.env.WAITLIST_SECRET;
  
  // If not configured, skip gate (allow developers to get started)
  if (!waitlistSecret) return NextResponse.next();

  // Check header or cookie
  const authHeader = req.headers.get("x-vibeflow-secret");
  const authCookie = req.cookies.get("v_secret")?.value;

  const isAuthorized = authHeader === waitlistSecret || authCookie === waitlistSecret;
  const isApiRoute = req.nextUrl.pathname.startsWith("/api");
  const isAccessPage = req.nextUrl.pathname === "/access";

  if (!isAuthorized && !isAccessPage && !isApiRoute) {
    // Redirect to access page
    return NextResponse.redirect(new URL("/access", req.url));
  }

  // API blocks must be explicit (don't leak keys)
  if (isApiRoute && !isAuthorized && req.nextUrl.pathname.startsWith("/api/automate")) {
    return new NextResponse(JSON.stringify({ error: "Access denied" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
