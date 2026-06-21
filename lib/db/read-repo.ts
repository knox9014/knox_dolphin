import { getDb } from "./connection.ts";

// Read-only helpers for the UI. No writes here.

export interface PendingCandidate {
  id: number;
  decision: string;
  reason: string | null;
  alternatives: string | null;
  rejected_because: string | null;
  impact: string | null;
  source_quote: string;
  speaker: string | null;
  extracted_at: string;
}

export interface StoredDecision {
  id: number;
  decision: string;
  reason: string | null;
  source_quote: string;
  status: string;
  confirmed_at: string;
}

/** Ensure a single default project exists (local single-user MVP, D8). */
export function ensureDefaultProject(): number {
  const db = getDb();
  const existing = db.prepare("SELECT id FROM projects ORDER BY id LIMIT 1").get() as
    | { id: number }
    | undefined;
  if (existing) return existing.id;
  const info = db.prepare("INSERT INTO projects(name) VALUES ('default')").run();
  return Number(info.lastInsertRowid);
}

export function listPendingCandidates(projectId: number): PendingCandidate[] {
  return getDb()
    .prepare(
      `SELECT id, decision, reason, alternatives, rejected_because, impact,
              source_quote, speaker, extracted_at
         FROM candidates
        WHERE project_id = ? AND reviewed = 0
        ORDER BY id DESC`
    )
    .all(projectId) as PendingCandidate[];
}

export function listDecisions(projectId: number): StoredDecision[] {
  return getDb()
    .prepare(
      `SELECT id, decision, reason, source_quote, status, confirmed_at
         FROM decisions WHERE project_id = ? ORDER BY id DESC`
    )
    .all(projectId) as StoredDecision[];
}
