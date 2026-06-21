import type { ParsedLog } from "../../lib/claude-code-logs/types.ts";
import type { DecisionProvider, RawCandidate } from "./provider.ts";

// Key-free stand-in for the real LLM extractor. It does NOT infer decisions —
// it surfaces substantial DEVELOPER statements as candidates for human review,
// using the verbatim message as both the proposed decision text and the
// source_quote. Because the quote is the real message, the substring guard
// always passes; because there's no inference, no fabrication is possible.
//
// Swap this for an Anthropic-backed provider (same interface) once a key exists.

// Injected wrappers and system noise — not real developer speech.
const NOISE_PREFIXES = ["<scheduled-task", "<system-reminder", "<command-", "<local-command"];

function looksLikeNoise(text: string): boolean {
  const t = text.trimStart();
  if (NOISE_PREFIXES.some((p) => t.startsWith(p))) return true;
  // very short turns ("ok", "네", "yes") carry no durable decision
  if (text.trim().length < 25) return true;
  return false;
}

export const heuristicProvider: DecisionProvider = {
  async propose(log: ParsedLog): Promise<RawCandidate[]> {
    const candidates: RawCandidate[] = [];
    for (const m of log.messages) {
      if (m.speaker !== "developer") continue; // a decision counts only if the developer stated it
      if (looksLikeNoise(m.text)) continue;

      const quote = m.text.trim();
      // Use a short headline as the decision label; keep full text as the source.
      const headline = quote.length > 90 ? quote.slice(0, 90).trimEnd() + "…" : quote;
      candidates.push({
        decision: headline,
        reason: null,
        alternatives: null,
        rejected_because: null,
        impact: null,
        source_quote: quote,
        speaker: "developer",
      });
    }
    return candidates;
  },
};
