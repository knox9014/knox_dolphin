import Anthropic from "@anthropic-ai/sdk";
import type { AnswerProvider } from "./recall.ts";
import type { DecisionRecord } from "./retriever.ts";

// Real LLM answerer. It is only ever called with non-empty records (the recall
// pipeline gates that), and the prompt forbids using anything outside them — so
// the "no ungrounded answers" invariant holds at both the code and prompt level.
//
// The v0 recall prompt is taken verbatim from docs/ARCHITECTURE.md §5.

const RECALL_SYSTEM = `You answer a developer's question about WHY a past decision was made,
using ONLY the provided decision records (the project's confirmed memory).

RULES
1. Answer strictly from the records. No general knowledge or opinions.
   If they don't contain the answer, say so plainly — that is a correct,
   valuable answer. Never pad with a guess.
2. Cite every claim (which record: quote, date, session).
3. If a relevant decision was superseded, report BOTH the original and
   that it changed, with both records.
4. If records are only loosely related, say the memory doesn't cover it.
5. Output nothing not grounded in a provided record.

Answer in the question's language.`;

function renderRecords(records: DecisionRecord[]): string {
  return records
    .map(
      (r, i) =>
        `[#${r.id}] (status: ${r.status}, confirmed_at: ${r.confirmed_at})\n` +
        `  decision: ${r.decision}\n` +
        (r.reason ? `  reason: ${r.reason}\n` : "") +
        (r.alternatives ? `  alternatives: ${r.alternatives}\n` : "") +
        (r.rejected_because ? `  rejected_because: ${r.rejected_because}\n` : "") +
        (r.impact ? `  impact: ${r.impact}\n` : "") +
        `  source_quote: "${r.source_quote}"`
    )
    .join("\n\n");
}

export function anthropicAnswerer(apiKey: string): AnswerProvider {
  const client = new Anthropic({ apiKey });
  return {
    async answer(question: string, records: DecisionRecord[]): Promise<string> {
      const msg = await client.messages.create({
        model: "claude-opus-4-8",
        max_tokens: 1024,
        system: RECALL_SYSTEM,
        messages: [
          {
            role: "user",
            content: `RECORDS:\n${renderRecords(records)}\n\nQUESTION: ${question}`,
          },
        ],
      });
      return msg.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n");
    },
  };
}
