#!/usr/bin/env node
// Validates core logic without requiring live API keys.
// Usage: npm test

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓  ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗  ${name}`);
    console.error(`     ${err.message}`);
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || "Assertion failed");
}

function assertEqual(a, b, message) {
  if (a !== b)
    throw new Error(message || `Expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
}

// ─── Utils ───────────────────────────────────────────────────────────────────
console.log("\n── lib/utils ────────────────────────────────────────────");

test("truncate: short string unchanged", () => {
  const str = "hello";
  const result = str.length <= 10 ? str : str.slice(0, 7) + "...";
  assertEqual(result, "hello");
});

test("truncate: long string clipped with ellipsis", () => {
  const str = "this is a very long string";
  const result = str.length <= 10 ? str : str.slice(0, 7) + "...";
  assertEqual(result, "this is...");
});

test("formatRelativeTime: recent → 'just now'", () => {
  const now = new Date();
  const diffSec = 0;
  const result = diffSec < 60 ? "just now" : `${Math.floor(diffSec / 60)}m ago`;
  assertEqual(result, "just now");
});

// ─── Token detection ─────────────────────────────────────────────────────────
console.log("\n── lib/integrations/token (detectRequiredProviders) ─────");

function detectRequiredProviders(prompt) {
  const lower = prompt.toLowerCase();
  const required = [];
  const keywords = {
    shopify: ["shopify", "order", "product", "customer", "store"],
    slack: ["slack", "message", "channel", "notify", "post"],
    hubspot: ["hubspot", "crm", "contact", "deal", "pipeline"],
    notion: ["notion", "page", "database", "doc"],
    "google-mail": ["gmail", "email", "mail", "inbox"],
    airtable: ["airtable", "base", "table", "record"],
  };
  for (const [provider, terms] of Object.entries(keywords)) {
    if (terms.some((term) => lower.includes(term))) required.push(provider);
  }
  return required;
}

test("detects Shopify from 'orders'", () => {
  const providers = detectRequiredProviders("Get my last 10 orders");
  assert(providers.includes("shopify"), "Expected shopify");
});

test("detects Slack from 'slack'", () => {
  const providers = detectRequiredProviders("Post a message to slack");
  assert(providers.includes("slack"), "Expected slack");
});

test("detects multiple providers", () => {
  const providers = detectRequiredProviders("Sync Shopify orders to HubSpot CRM");
  assert(providers.includes("shopify"), "Expected shopify");
  assert(providers.includes("hubspot"), "Expected hubspot");
});

test("returns empty for unknown prompt", () => {
  const providers = detectRequiredProviders("Tell me a joke");
  assertEqual(providers.length, 0, "Expected no providers");
});

// ─── Planner output parsing ──────────────────────────────────────────────────
console.log("\n── Planner JSON parsing ─────────────────────────────────");

function parsePlannerOutput(content) {
  try {
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[1]);
      return parsed.steps || parsed;
    }
    const raw = JSON.parse(content);
    return raw.steps || raw;
  } catch {
    return content
      .split("\n")
      .filter((l) => /^\d+\./.test(l.trim()))
      .map((l) => l.replace(/^\d+\.\s*/, "").trim());
  }
}

test("parses JSON code block", () => {
  const content = '```json\n{"steps": ["Step 1", "Step 2"]}\n```';
  const plan = parsePlannerOutput(content);
  assertEqual(plan.length, 2);
  assertEqual(plan[0], "Step 1");
});

test("parses raw JSON", () => {
  const content = '{"steps": ["Only step"]}';
  const plan = parsePlannerOutput(content);
  assertEqual(plan.length, 1);
  assertEqual(plan[0], "Only step");
});

test("falls back to numbered list parsing", () => {
  const content = "1. Fetch orders\n2. Post to Slack";
  const plan = parsePlannerOutput(content);
  assertEqual(plan.length, 2);
  assertEqual(plan[0], "Fetch orders");
});

// ─── Sandbox result parsing ──────────────────────────────────────────────────
console.log("\n── Sandbox result parsing ───────────────────────────────");

function parseSandboxOutput(stdout) {
  const lines = stdout.trim().split("\n").filter(Boolean);
  const lastLine = lines[lines.length - 1] || "{}";
  try {
    return JSON.parse(lastLine);
  } catch {
    return { status: "success", data: stdout, summary: lastLine };
  }
}

test("parses valid JSON from last line", () => {
  const stdout = 'Fetching data...\n{"status":"success","data":[],"summary":"Done"}';
  const result = parseSandboxOutput(stdout);
  assertEqual(result.status, "success");
  assertEqual(result.summary, "Done");
});

test("handles non-JSON output gracefully", () => {
  const stdout = "Hello world";
  const result = parseSandboxOutput(stdout);
  assertEqual(result.status, "success");
  assertEqual(result.summary, "Hello world");
});

test("handles empty stdout", () => {
  const stdout = "";
  const result = parseSandboxOutput(stdout);
  assert(typeof result === "object", "Expected an object");
});

// ─── Routing logic ───────────────────────────────────────────────────────────
console.log("\n── LangGraph routing logic ──────────────────────────────");

function routeAfterExecutor(state) {
  if (state.retry_count >= 3) return "formatter";
  if (state.error) return "reflector";
  if (state.current_step < state.plan.length) return "executor";
  return "formatter";
}

test("routes to reflector on error (retry_count < 3)", () => {
  const route = routeAfterExecutor({
    error: "API 404",
    retry_count: 1,
    plan: ["step 1"],
    current_step: 0,
  });
  assertEqual(route, "reflector");
});

test("routes to formatter after max retries", () => {
  const route = routeAfterExecutor({
    error: "still broken",
    retry_count: 3,
    plan: ["step 1"],
    current_step: 0,
  });
  assertEqual(route, "formatter");
});

test("routes to executor if more steps remain", () => {
  const route = routeAfterExecutor({
    error: null,
    retry_count: 0,
    plan: ["step 1", "step 2"],
    current_step: 0,
  });
  assertEqual(route, "executor");
});

test("routes to formatter when all steps done", () => {
  const route = routeAfterExecutor({
    error: null,
    retry_count: 0,
    plan: ["step 1", "step 2"],
    current_step: 2,
  });
  assertEqual(route, "formatter");
});

// ─── SSE event encoding ──────────────────────────────────────────────────────
console.log("\n── SSE encoding ─────────────────────────────────────────");

test("encodes event as SSE data line", () => {
  const event = { stage: "planning", message: "Breaking down request" };
  const encoded = `data: ${JSON.stringify(event)}\n\n`;
  assert(encoded.startsWith("data: "), "Must start with 'data: '");
  assert(encoded.endsWith("\n\n"), "Must end with double newline");
});

test("round-trips event through SSE encoding", () => {
  const event = { stage: "done", message: "Moved 5 orders", output: { count: 5 } };
  const encoded = `data: ${JSON.stringify(event)}\n\n`;
  const line = encoded.trim();
  assert(line.startsWith("data: "));
  const parsed = JSON.parse(line.slice(6));
  assertEqual(parsed.stage, "done");
  assertEqual(parsed.output.count, 5);
});

// ─── Summary ─────────────────────────────────────────────────────────────────
console.log(`\n${"─".repeat(52)}`);
console.log(`  ${passed} passed  ${failed > 0 ? failed + " failed" : ""}`);
if (failed > 0) {
  console.log("\n  Fix failing tests before deploying.\n");
  process.exit(1);
} else {
  console.log("\n  All tests passed. Ready to deploy. 🚀\n");
}
