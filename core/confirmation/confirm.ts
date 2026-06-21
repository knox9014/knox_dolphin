import { getDb } from "../../lib/db/connection.ts";
import { isVerbatimQuote } from "../trust/source-quote.ts";

// The confirmation gate: the ONE place that writes to `decisions` (invariant #2).
// A human picks a candidate; only then does it become a trusted memory.
//
// Even here we don't trust blindly — the source_quote is re-validated against the
// stored conversation-equivalent text before promotion. Belt and suspenders.

export interface PromoteResult {
  decisionId: number;
}

interface CandidateRow {
  id: number;
  project_id: number;
  decision: string;
  reason: string | null;
  alternatives: string | null;
  rejected_because: string | null;
  impact: string | null;
  source_quote: string;
  session_id: string | null;
  speaker: string | null;
  reviewed: number;
}

function loadCandidate(id: number): CandidateRow {
  const row = getDb()
    .prepare("SELECT * FROM candidates WHERE id = ?")
    .get(id) as CandidateRow | undefined;
  if (!row) throw new Error(`candidate ${id} not found`);
  return row;
}

/**
 * Promote a candidate into the `decisions` sanctuary.
 * @param conversationText OPTIONAL original log text. When present (e.g. promoting
 *   right after extraction) the quote is re-validated against it. When absent (the
 *   normal UI case — transcripts aren't stored, invariant #5) we rely on the guard
 *   that already ran at candidate insert time plus the DB's source_quote NOT NULL.
 */
export function confirmCandidate(candidateId: number, conversationText?: string): PromoteResult {
  const c = loadCandidate(candidateId);

  if (c.reviewed === 1) throw new Error(`candidate ${candidateId} already reviewed`);
  if (!c.source_quote?.trim()) throw new Error("candidate has no source_quote — cannot promote");
  if (conversationText !== undefined && !isVerbatimQuote(c.source_quote, conversationText)) {
    throw new Error("source_quote no longer verifiable against the conversation — refusing to promote");
  }

  const db = getDb();
  db.exec("BEGIN");
  try {
    const info = db
      .prepare(
        `INSERT INTO decisions
          (project_id, decision, reason, alternatives, rejected_because, impact,
           source_quote, session_id, speaker, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed')`
      )
      .run(
        c.project_id, c.decision, c.reason, c.alternatives, c.rejected_because,
        c.impact, c.source_quote, c.session_id, c.speaker
      );
    db.prepare("UPDATE candidates SET reviewed = 1 WHERE id = ?").run(candidateId);
    db.exec("COMMIT");
    return { decisionId: Number(info.lastInsertRowid) };
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}

/** Reject a candidate: mark it reviewed, write nothing to `decisions`. */
export function rejectCandidate(candidateId: number): void {
  const c = loadCandidate(candidateId);
  if (c.reviewed === 1) throw new Error(`candidate ${candidateId} already reviewed`);
  getDb().prepare("UPDATE candidates SET reviewed = 1 WHERE id = ?").run(candidateId);
}
