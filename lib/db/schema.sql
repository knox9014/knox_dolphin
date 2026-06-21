-- Knox_Dolphin schema (build step 2).
-- Three tables, local single-user (no users table — DECISIONS D8).
-- The trust invariants live HERE as DB constraints so they cannot be bypassed by code.

-- ── projects ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── candidates (staging) ────────────────────────────────────────────────────
-- Extraction output lands here. Noise is allowed; nothing here is trusted yet.
-- No embedding column: embeddings are generated only on promotion (D7).
CREATE TABLE IF NOT EXISTS candidates (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id        INTEGER NOT NULL REFERENCES projects(id),
  decision          TEXT NOT NULL,
  reason            TEXT,
  alternatives      TEXT,
  rejected_because  TEXT,
  impact            TEXT,
  source_quote      TEXT NOT NULL,           -- even a candidate must carry its source
  session_id        TEXT,
  speaker           TEXT CHECK (speaker IN ('developer', 'assistant')),
  reviewed          INTEGER NOT NULL DEFAULT 0,  -- 0 = pending, 1 = reviewed
  extracted_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── decisions (sanctuary) ───────────────────────────────────────────────────
-- Only core/confirmation writes here, only after human approval.
-- INVARIANT #1: source_quote NOT NULL — a decision without a source cannot exist.
CREATE TABLE IF NOT EXISTS decisions (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id        INTEGER NOT NULL REFERENCES projects(id),
  decision          TEXT NOT NULL,
  reason            TEXT,
  alternatives      TEXT,
  rejected_because  TEXT,
  impact            TEXT,
  source_quote      TEXT NOT NULL,           -- ← invariant enforced by the DB
  session_id        TEXT,
  source_timestamp  TEXT,
  speaker           TEXT CHECK (speaker IN ('developer', 'assistant')),
  status            TEXT NOT NULL DEFAULT 'confirmed'
                      CHECK (status IN ('confirmed', 'superseded')),
  superseded_by     INTEGER REFERENCES decisions(id),
  embedding         BLOB,                    -- filled at promotion; vector ext added in step 6
  embedding_model   TEXT,
  confirmed_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_candidates_project_reviewed
  ON candidates(project_id, reviewed);
CREATE INDEX IF NOT EXISTS idx_decisions_project_status
  ON decisions(project_id, status);
