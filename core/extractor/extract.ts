import type { ParsedLog } from "../../lib/claude-code-logs/types.ts";
import { isVerbatimQuote } from "../trust/source-quote.ts";
import type { DecisionProvider, RawCandidate } from "./provider.ts";

// Extraction pipeline. Note what it does NOT import: the `decisions` table.
// Extractor writes to `candidates` only (invariant #2). It also never trusts the
// provider — every proposed candidate must pass the verbatim-quote guard.

export interface ExtractResult {
  kept: RawCandidate[];
  discarded: { candidate: RawCandidate; reason: string }[];
}

/** Build one flat conversation string to validate quotes against. */
function conversationText(log: ParsedLog): string {
  return log.messages.map((m) => m.text).join("\n");
}

export async function extract(
  log: ParsedLog,
  provider: DecisionProvider
): Promise<ExtractResult> {
  const convo = conversationText(log);
  const proposed = await provider.propose(log);

  const kept: RawCandidate[] = [];
  const discarded: ExtractResult["discarded"] = [];

  for (const c of proposed) {
    if (!c.decision?.trim()) {
      discarded.push({ candidate: c, reason: "empty decision" });
      continue;
    }
    if (!isVerbatimQuote(c.source_quote ?? "", convo)) {
      // The provider invented a quote that isn't in the log → fabrication. Drop it.
      discarded.push({ candidate: c, reason: "source_quote not found in conversation" });
      continue;
    }
    kept.push(c);
  }

  return { kept, discarded };
}
