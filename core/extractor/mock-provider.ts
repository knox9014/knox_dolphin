import type { ParsedLog } from "../../lib/claude-code-logs/types.ts";
import type { DecisionProvider, RawCandidate } from "./provider.ts";

// A stand-in for the real LLM, used until an API key is wired in. It returns a
// fixed set of candidates so the pipeline (and especially the substring guard)
// can be exercised with zero API calls. Deliberately includes a FABRICATED quote
// so tests can prove the guard discards it.
export function mockProvider(candidates: RawCandidate[]): DecisionProvider {
  return {
    async propose(_log: ParsedLog): Promise<RawCandidate[]> {
      return candidates;
    },
  };
}
