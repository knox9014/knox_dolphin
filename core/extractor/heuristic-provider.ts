import type { ParsedLog } from "../../lib/claude-code-logs/types.ts";
import type { DecisionProvider, RawCandidate } from "./provider.ts";

// Key-free stand-in for the real LLM extractor. It does NOT infer — it surfaces
// DEVELOPER statements that *look like* durable decisions, using the verbatim
// message as the source_quote. No inference → no fabrication. Precision-first
// (D5): better to miss a decision (re-extract later) than to flood the review
// queue with noise. Swap for an Anthropic provider (same interface) given a key.

// Injected wrappers / system noise — never real developer speech.
const NOISE_PREFIXES = ["<scheduled-task", "<system-reminder", "<command-", "<local-command", "<budget"];

// Decision-signal vocabulary (Korean + English). A message must contain at least
// one of these to be surfaced — this is what separates "let's use SQLite because…"
// from "can you fix this?" or "ok thanks".
const SIGNALS = [
  // Korean
  "쓰자", "쓰기로", "하기로", "가자", "가기로", "대신", "때문", "이유", "결정",
  "채택", "선택", "정하자", "정했", "하지 말", "안 하기로", "유지", "버리",
  // English
  "use ", "instead", "because", "decide", "decided", "go with", "rather than",
  "adopt", "choose", "chosen", "prefer", "avoid", "drop ", "keep ",
];

// Imperative requests aimed at the assistant ("만들어줘", "고쳐줘") are work items,
// not decisions. If a short message is dominated by these, skip it.
const REQUEST_HINTS = ["해줘", "해 줘", "해보자", "고쳐", "만들어", "보여줘", "알려줘", "추가해"];

function isQuestion(text: string): boolean {
  const t = text.trim();
  if (t.endsWith("?")) return true;
  // common Korean interrogative endings
  return /(나요|까요|을까|ㄹ까|어때|되나|있나|는지)\??$/.test(t);
}

function isCodeHeavy(text: string): boolean {
  if (text.includes("```")) return true;
  // mostly non-letters (paths, json, logs)
  const letters = (text.match(/[\p{L}]/gu) ?? []).length;
  return letters / Math.max(text.length, 1) < 0.4;
}

function hasSignal(lower: string): boolean {
  return SIGNALS.some((s) => lower.includes(s));
}

function looksLikeRequest(text: string): boolean {
  return REQUEST_HINTS.some((h) => text.includes(h)) && !hasSignal(text.toLowerCase());
}

export const heuristicProvider: DecisionProvider = {
  async propose(log: ParsedLog): Promise<RawCandidate[]> {
    const seen = new Set<string>();
    const candidates: RawCandidate[] = [];

    for (const m of log.messages) {
      if (m.speaker !== "developer") continue;
      const text = m.text.trim();

      // Korean is information-dense, so a low char floor still filters fragments;
      // the signal-vocabulary check below is the real precision lever.
      if (text.length < 15 || text.length > 2000) continue;
      if (NOISE_PREFIXES.some((p) => text.trimStart().startsWith(p))) continue;
      if (isQuestion(text)) continue;
      if (isCodeHeavy(text)) continue;
      if (!hasSignal(text.toLowerCase())) continue; // ← the precision lever
      if (looksLikeRequest(text)) continue;
      if (seen.has(text)) continue; // dedupe identical statements
      seen.add(text);

      const headline = text.length > 90 ? text.slice(0, 90).trimEnd() + "…" : text;
      candidates.push({
        decision: headline,
        reason: null,
        alternatives: null,
        rejected_because: null,
        impact: null,
        source_quote: text,
        speaker: "developer",
      });
    }
    return candidates;
  },
};
