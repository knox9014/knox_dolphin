// Retrieval is a pluggable dependency, same pattern as the extractor's provider.
// Today: keyword search over `decisions`. Later (D9): vector search via a SQLite
// vector extension. The recall pipeline depends only on this interface.

export interface DecisionRecord {
  id: number;
  decision: string;
  reason: string | null;
  alternatives: string | null;
  rejected_because: string | null;
  impact: string | null;
  source_quote: string;
  session_id: string | null;
  status: string;
  superseded_by: number | null;
  confirmed_at: string;
  score: number; // higher = more relevant
}

export interface Retriever {
  /** Return the top matches for a question, best first. May return []. */
  retrieve(projectId: number, question: string, topK: number): DecisionRecord[];
}
