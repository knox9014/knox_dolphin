import Anthropic from "@anthropic-ai/sdk";
import type { ParsedLog } from "../../lib/claude-code-logs/types.ts";
import type { DecisionProvider, RawCandidate } from "./provider.ts";

// Real LLM extractor. Uses the v0 extraction prompt from docs/ARCHITECTURE.md §5.
// It may still hallucinate a quote — that's fine: the pipeline's substring guard
// (core/trust) discards any candidate whose source_quote isn't in the conversation.
// Records only what is explicitly stated; never infers (null when unstated).

const EXTRACT_SYSTEM = `You extract TECHNICAL DECISIONS from a conversation between a developer
and an AI coding assistant. Record only what is explicitly stated.
Never infer, guess, or invent reasoning.

RULES
1. Extract only durable technical/architectural decisions. Ignore routine
   work: bug fixes, typos, debugging chatter.
2. A decision counts ONLY if the DEVELOPER adopted it (stated by the
   developer, or proposed by the assistant AND agreed by the developer).
3. If a decision was reversed later, record only the FINAL one (note the
   change in impact).
4. For reason/alternatives/rejected_because/impact: use ONLY explicit text.
   If not stated, set null. Never fill with plausible content.
5. source_quote MUST be an exact verbatim substring from the conversation.
   Keep its original language.
6. Write fields in the conversation's language.
7. If no real decisions, return an empty list. Never manufacture.

Output STRICT JSON only:
{ "decisions": [ { "decision": str, "reason": str|null,
  "alternatives": str|null, "rejected_because": str|null,
  "impact": str|null, "source_quote": str,
  "speaker": "developer"|"assistant" } ] }`;

const MAX_CHARS = 60000; // bound cost on very long logs

function transcript(log: ParsedLog): string {
  const full = log.messages.map((m) => `${m.speaker}: ${m.text}`).join("\n\n");
  return full.length > MAX_CHARS ? full.slice(-MAX_CHARS) : full;
}

interface LlmDecision {
  decision: string;
  reason: string | null;
  alternatives: string | null;
  rejected_because: string | null;
  impact: string | null;
  source_quote: string;
  speaker: "developer" | "assistant";
}

export function anthropicProvider(apiKey: string): DecisionProvider {
  const client = new Anthropic({ apiKey });
  return {
    async propose(log: ParsedLog): Promise<RawCandidate[]> {
      const msg = await client.messages.create({
        model: "claude-opus-4-8",
        max_tokens: 4096,
        system: EXTRACT_SYSTEM,
        messages: [{ role: "user", content: `CONVERSATION:\n${transcript(log)}` }],
      });
      const raw = msg.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("");
      let parsed: { decisions?: LlmDecision[] };
      try {
        const json = raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1);
        parsed = JSON.parse(json);
      } catch {
        return []; // malformed → surface nothing rather than guess
      }
      return (parsed.decisions ?? []).map((d) => ({
        decision: d.decision,
        reason: d.reason ?? null,
        alternatives: d.alternatives ?? null,
        rejected_because: d.rejected_because ?? null,
        impact: d.impact ?? null,
        source_quote: d.source_quote,
        speaker: d.speaker === "assistant" ? "assistant" : "developer",
      }));
    },
  };
}
