-- VibeFlow Database Schema
-- Run with: node scripts/migrate.js

-- Enable pgvector for integration memory embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- ─── Users ───────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id                 TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email              TEXT UNIQUE NOT NULL,
  password_hash      TEXT NOT NULL,
  openrouter_api_key TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);

-- ─── Sessions (Chat Workflows) ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      TEXT NOT NULL DEFAULT 'New Workflow',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);
CREATE INDEX IF NOT EXISTS sessions_updated_at_idx ON sessions(updated_at DESC);

-- ─── Executions ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS executions (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id       TEXT NOT NULL,
  thread_id     TEXT NOT NULL,
  prompt        TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'running', 'success', 'failed', 'waiting')),
  stage         TEXT NOT NULL DEFAULT 'idle',
  output        TEXT,
  error         TEXT,
  script        TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS executions_user_id_idx ON executions(user_id);
CREATE INDEX IF NOT EXISTS executions_thread_id_idx ON executions(thread_id);
CREATE INDEX IF NOT EXISTS executions_created_at_idx ON executions(created_at DESC);

-- ─── Execution Logs ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS execution_logs (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  execution_id  TEXT NOT NULL REFERENCES executions(id) ON DELETE CASCADE,
  stage         TEXT NOT NULL,
  message       TEXT NOT NULL,
  detail        TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS execution_logs_execution_id_idx ON execution_logs(execution_id);

-- ─── Integration Memory (pgvector) ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS integration_memories (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id         TEXT NOT NULL,
  provider        TEXT NOT NULL,
  endpoint        TEXT NOT NULL,
  script_template TEXT NOT NULL,
  success_count   INTEGER NOT NULL DEFAULT 1,
  embedding       vector(1536),   -- OpenAI text-embedding-3-small dimensions
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS integration_memories_user_id_idx ON integration_memories(user_id);
CREATE INDEX IF NOT EXISTS integration_memories_embedding_idx
  ON integration_memories USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- ─── Scheduled Automations ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS schedules (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id     TEXT NOT NULL,
  name        TEXT NOT NULL,
  prompt      TEXT NOT NULL,
  cron        TEXT,                 -- e.g. "0 9 * * 1" for Monday 9am
  webhook_url TEXT,                 -- for event-based triggers
  enabled     BOOLEAN NOT NULL DEFAULT true,
  last_run_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS schedules_user_id_idx ON schedules(user_id);

-- ─── Auto-update updated_at ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS executions_updated_at ON executions;
CREATE TRIGGER executions_updated_at
  BEFORE UPDATE ON executions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS integration_memories_updated_at ON integration_memories;
CREATE TRIGGER integration_memories_updated_at
  BEFORE UPDATE ON integration_memories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
