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

    const rows = getDb()
      .prepare(
        `SELECT id, decision, reason, alternatives, rejected_because, impact,
                source_quote, session_id, status, confirmed_at
           FROM decisions WHERE project_id = ?`
      )
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

    return scored;
  },
};
