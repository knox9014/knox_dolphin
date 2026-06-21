import { getDb } from "../../lib/db/connection.ts";
import type { DecisionRecord, Retriever } from "./retriever.ts";

// Keyword retriever: a simple, dependency-free baseline so recall works without a
// key or vector extension. Scores by how many distinct query terms appear in the
// decision's searchable text. Good enough to prove the "no record → don't answer"
// guard; a vector retriever can replace it later without touching the pipeline.

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((t) => t.length >= 2);
}

export const keywordRetriever: Retriever = {
  retrieve(projectId: number, question: string, topK: number): DecisionRecord[] {
    const terms = [...new Set(tokenize(question))];
    if (terms.length === 0) return [];

    const cols = `id, decision, reason, alternatives, rejected_because, impact,
                  source_quote, session_id, status, superseded_by, confirmed_at`;
    const db = getDb();
    const rows = db
      .prepare(`SELECT ${cols} FROM decisions WHERE project_id = ?`)
      .all(projectId) as Omit<DecisionRecord, "score">[];

    const scored = rows
      .map((r) => {
        const hay = [r.decision, r.reason, r.alternatives, r.rejected_because, r.impact, r.source_quote]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        const score = terms.reduce((n, t) => (hay.includes(t) ? n + 1 : n), 0);
        return { ...r, score };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    // Invariant #6/§5-rule-3: if a superseded decision is in the results, also
    // pull in its replacement so the answer can report BOTH — even when the
    // replacement didn't independently match the query.
    const present = new Set(scored.map((r) => r.id));
    for (const r of scored) {
      if (r.status === "superseded" && r.superseded_by != null && !present.has(r.superseded_by)) {
        const repl = db
          .prepare(`SELECT ${cols} FROM decisions WHERE id = ?`)
          .get(r.superseded_by) as Omit<DecisionRecord, "score"> | undefined;
        if (repl) {
          scored.push({ ...repl, score: 0 }); // included as context, not a ranked hit
          present.add(repl.id);
        }
      }
    }

    return scored;
  },
};
