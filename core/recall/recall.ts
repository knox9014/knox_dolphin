import type { DecisionRecord, Retriever } from "./retriever.ts";

// Recall pipeline. The trust invariant lives in the control flow: if retrieval
// finds nothing relevant, we return "기록 없음" WITHOUT ever calling the model.
// A model that is never called cannot hallucinate an answer (invariant #3).

export interface AnswerProvider {
  /** Answer strictly from the given records. Only called when records exist. */
  answer(question: string, records: DecisionRecord[]): Promise<string>;
}

export const NO_RECORD = "기록 없음" as const;

export interface RecallResult {
  answer: string;
  grounded: boolean; // false = "기록 없음", no model was called
  records: DecisionRecord[];
}

export async function recall(
  projectId: number,
  question: string,
  retriever: Retriever,
  answerer: AnswerProvider,
  opts: { topK?: number } = {}
): Promise<RecallResult> {
  const topK = opts.topK ?? 5;
  const records = retriever.retrieve(projectId, question, topK);

  if (records.length === 0) {
    // No grounding → refuse to answer. This is a correct, valuable answer (D3).
    return { answer: NO_RECORD, grounded: false, records: [] };
  }

  const answer = await answerer.answer(question, records);
  return { answer, grounded: true, records };
}
