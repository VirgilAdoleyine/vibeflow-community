import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicPaths = ["/signin", "/signup", "/api/auth/signup", "/api/auth/signin", "/api/auth/logout"];
const staticPaths = ["/_next", "/favicon"];

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  
  // Allow static files
  if (staticPaths.some(p => path.startsWith(p))) {
    return NextResponse.next();
  }
  
  // Allow auth pages and API
  if (publicPaths.includes(path) || path.startsWith("/api/auth")) {
    return NextResponse.next();
  }
  
  // Check for session cookie
  const sessionCookie = req.cookies.get("session")?.value;
  
  if (!sessionCookie && path !== "/signup" && path !== "/signin") {
    // Redirect to signin if no session
    return NextResponse.redirect(new URL("/signin", req.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
