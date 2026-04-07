import sql from "./client";
import { v4 as uuidv4 } from "uuid";
import type { User, UserSession, CreateUserInput } from "@/types/user";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-in-production";

function hashPassword(password: string): string {
  const crypto = require("crypto");
  return crypto.createHash("sha256").update(password).digest("hex");
}

export async function createUser(input: CreateUserInput): Promise<User> {
  const passwordHash = hashPassword(input.password);
  const id = uuidv4();

  const rows = await sql`
    INSERT INTO users (id, email, password_hash, openrouter_api_key)
    VALUES (${id}, ${input.email}, ${passwordHash}, ${input.openrouter_api_key || null})
    RETURNING *
  ` as unknown as User[];

  return rows[0];
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const rows = await sql`
    SELECT * FROM users WHERE email = ${email} LIMIT 1
  ` as unknown as User[];
  return rows[0] ?? null;
}

export async function getUserById(id: string): Promise<User | null> {
  const rows = await sql`
    SELECT * FROM users WHERE id = ${id} LIMIT 1
  ` as unknown as User[];
  return rows[0] ?? null;
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return hashPassword(password) === hash;
}

export function createSessionToken(user: { id: string; email: string }): string {
  const crypto = require("crypto");
  const payload = JSON.stringify({ id: user.id, email: user.email });
  const encodedPayload = Buffer.from(payload).toString("base64");
  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(encodedPayload)
    .digest("hex");
  return signature + "." + encodedPayload;
}

export function verifySessionToken(token: string): { id: string; email: string } | null {
  try {
    const crypto = require("crypto");
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    
    const [signature, encodedPayload] = parts;
    const expectedSignature = crypto
      .createHmac("sha256", JWT_SECRET)
      .update(encodedPayload)
      .digest("hex");
    
    if (signature !== expectedSignature) return null;
    
    const payload = Buffer.from(encodedPayload, "base64").toString();
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

export async function updateUserApiKey(
  userId: string,
  apiKey: string
): Promise<void> {
  await sql`
    UPDATE users SET openrouter_api_key = ${apiKey}, updated_at = NOW()
    WHERE id = ${userId}
  `;
}
