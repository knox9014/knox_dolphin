import type { ParsedLog } from "../../lib/claude-code-logs/types.ts";

// The LLM is a pluggable dependency. The extractor pipeline depends only on this
// interface — never on Anthropic directly — so it can run (and be tested) with a
// mock today and a real API client once a key is available. No key, no problem.

export interface RawCandidate {
  decision: string;
  reason: string | null;
  alternatives: string | null;
  rejected_because: string | null;
  impact: string | null;
  source_quote: string;
  speaker: "developer" | "assistant";
}

export interface DecisionProvider {
  /** Given a parsed conversation, propose decision candidates. May hallucinate —
   *  the pipeline's substring guard is what keeps fabrications out. */
  propose(log: ParsedLog): Promise<RawCandidate[]>;
}
