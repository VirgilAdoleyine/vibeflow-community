#!/usr/bin/env node
// Run DB migrations against Neon
// Usage: node scripts/migrate.js

const fs = require("fs");
const path = require("path");

async function migrate() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("❌  DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.");
    process.exit(1);
  }

  let sql;
  try {
    const { neon } = require("@neondatabase/serverless");
    sql = neon(databaseUrl);
  } catch {
    console.error("❌  @neondatabase/serverless not installed. Run: npm install");
    process.exit(1);
  }

  const schemaPath = path.join(__dirname, "../lib/db/schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf-8");

  // Split on semicolons but keep individual statements
  const statements = schema
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));

  console.log(`🚀  Running ${statements.length} migration statements…`);

  for (const statement of statements) {
    try {
      await sql`${sql.unsafe(statement)}`;
      process.stdout.write(".");
    } catch (err) {
      if (
        err.message?.includes("already exists") ||
        err.message?.includes("duplicate")
      ) {
        process.stdout.write("·"); // Already applied — skip
      } else {
        console.error(`\n❌  Statement failed:\n${statement}\n\nError: ${err.message}`);
      }
    }
  }

  console.log("\n✅  Migration complete.");
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
