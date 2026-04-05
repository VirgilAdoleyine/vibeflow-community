import { neon } from "@neondatabase/serverless";

const connectionString = process.env.DATABASE_URL;

if (!connectionString && process.env.NODE_ENV === "production") {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Neon's serverless driver — works in edge and Node runtimes
export const sql = connectionString
  ? neon(connectionString)
  : // Stub for local dev without a DB
    (async (strings: TemplateStringsArray, ...values: unknown[]) => {
      console.warn("[db] No DATABASE_URL set — returning empty result");
      return [];
    }) as unknown as ReturnType<typeof neon>;

export default sql;
