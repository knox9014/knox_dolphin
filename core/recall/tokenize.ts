// Tokenizer for the keyword retriever. Key-free, dependency-free. Its job is to
// make Korean queries match Korean decision text despite attached particles
// ("SQLite를" vs "SQLite로") and Latin/Hangul running together ("sqlite를").
//
// Not a real morphological analyzer — a conservative, high-precision normalizer:
// split on script boundaries, then strip a small set of common particles.

// Common Korean particles, longest first so we strip the longest match.
const PARTICLES = [
  "으로써", "으로서", "이라는", "으로", "에서", "에게", "까지", "부터", "이라", "라고", "라는",
  "은", "는", "이", "가", "을", "를", "와", "과", "로", "에", "의", "도", "만", "께",
];

const HANGUL = /[가-힣]/;

/** Strip one trailing particle from a Hangul token, keeping at least 2 chars. */
function stripParticle(token: string): string {
  if (!HANGUL.test(token)) return token;
  for (const p of PARTICLES) {
    if (token.length > p.length + 1 && token.endsWith(p)) {
      return token.slice(0, -p.length);
    }
  }
  return token;
}

export function tokenize(s: string): string[] {
  const spaced = s
    .toLowerCase()
    // separate Latin/digit runs from Hangul runs ("sqlite를" -> "sqlite 를")
    .replace(/([a-z0-9])([가-힣])/g, "$1 $2")
    .replace(/([가-힣])([a-z0-9])/g, "$1 $2");

  const out = new Set<string>();
  for (const raw of spaced.split(/[^\p{L}\p{N}]+/u)) {
    if (raw.length < 2) continue;
    const t = stripParticle(raw);
    if (t.length >= 2) out.add(t);
  }
  return [...out];
}
