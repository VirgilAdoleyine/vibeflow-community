import { createHash } from "crypto";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

/**
 * Derives a stable, non-reversible user ID from the v_secret cookie value.
 * The raw secret is never used directly as a Nango connection_id so it never
 * leaks into the Nango dashboard or webhooks.
 */
export function deriveUserId(secret: string): string {
  return createHash("sha256").update(`vibeflow:${secret}`).digest("hex").slice(0, 24);
}

/**
 * Reads the v_secret cookie from the Next.js cookie store (server components /
 * route handlers that call cookies()) and returns the derived user ID.
 * Returns null if no secret is present.
 */
export async function getCurrentUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const secret = cookieStore.get("v_secret")?.value;
  if (!secret) return null;
  return deriveUserId(secret);
}

/**
 * Same as getCurrentUserId() but reads from a raw NextRequest object.
 * Use this inside middleware or any handler that already has the request.
 */
export function getUserIdFromRequest(req: NextRequest): string | null {
  const secret = req.cookies.get("v_secret")?.value;
  if (!secret) return null;
  return deriveUserId(secret);
}
