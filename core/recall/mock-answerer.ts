import type { AnswerProvider } from "./recall.ts";
import type { DecisionRecord } from "./retriever.ts";

// Stand-in for the LLM answerer until a key is wired in. It only ever echoes the
// provided records with citations — it cannot pull in outside knowledge, which is
// exactly the behavior the real prompt must enforce. Useful as a guardrail proof.
export const mockAnswerer: AnswerProvider = {
  async answer(_question: string, records: DecisionRecord[]): Promise<string> {
    return records
      .map((r) => `- ${r.decision} (출처: "${r.source_quote}", #${r.id}, ${r.status})`)
      .join("\n");
  },
};
