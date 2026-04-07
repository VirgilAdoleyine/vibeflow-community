import { cookies } from "next/headers";
import { verifySessionToken, getUserById } from "@/lib/db/user";
import type { User } from "@/types/user";

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session")?.value;
  
  if (!sessionCookie) return null;
  
  const payload = verifySessionToken(sessionCookie);
  if (!payload) return null;
  
  return getUserById(payload.id);
}

export async function getCurrentUserId(): Promise<string | null> {
  const user = await getCurrentUser();
  return user?.id || null;
}
