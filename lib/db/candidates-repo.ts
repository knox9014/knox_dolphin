import { getDb } from "./connection.ts";
import type { RawCandidate } from "../../core/extractor/provider.ts";

// Persistence for the staging table. This writer touches `candidates` ONLY.
// Promotion into `decisions` is a separate, human-gated path (build step 5).

export function saveCandidates(
  projectId: number,
  sessionId: string | null,
  candidates: RawCandidate[]
): number {
  const db = getDb();
  const stmt = db.prepare(
    `INSERT INTO candidates
      (project_id, decision, reason, alternatives, rejected_because, impact,
       source_quote, session_id, speaker)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  // node:sqlite has no transaction() helper — wrap manually so a partial batch
  // never leaves half-written candidates.
  db.exec("BEGIN");
  try {
    for (const c of candidates) {
      stmt.run(
        projectId,
        c.decision,
        c.reason,
        c.alternatives,
        c.rejected_because,
        c.impact,
        c.source_quote,
        sessionId,
        c.speaker
      );
    }
    db.exec("COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }

  return candidates.length;
}
