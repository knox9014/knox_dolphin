// Trust invariant #3 (ARCHITECTURE §4): an extracted source_quote MUST be a real
// verbatim substring of the actual conversation. If it isn't, the candidate is a
// fabrication and must be discarded — no exceptions, no "close enough".
//
// This is the single most important guard in the system: it's what makes the
// difference between "extraction" and "the AI inventing reasons" (DECISIONS D1).

/**
 * Normalize only what is safe to normalize: line endings (CRLF vs LF) and a
 * trailing/leading whitespace difference the model commonly introduces. We do
 * NOT lowercase, collapse internal whitespace, or strip punctuation — that would
 * let paraphrases sneak through, defeating the guard.
 */
function normalize(s: string): string {
  return s.replace(/\r\n/g, "\n").trim();
}

/** True only if `quote` appears verbatim somewhere in the conversation text. */
export function isVerbatimQuote(quote: string, conversation: string): boolean {
  const q = normalize(quote);
  if (q.length === 0) return false;
  return normalize(conversation).includes(q);
}
