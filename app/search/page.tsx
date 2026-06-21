"use client";

import Link from "next/link";
import { useState } from "react";

interface RecallResponse {
  answer: string;
  grounded: boolean;
  records: { id: number; decision: string; source_quote: string }[];
}

// Recall UI. Ask "why did we…" and get an answer grounded ONLY in stored decisions,
// or an honest "기록 없음".
export default function SearchPage() {
  const [q, setQ] = useState("");
  const [res, setRes] = useState<RecallResponse | null>(null);
  const [busy, setBusy] = useState(false);

  async function ask(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    setBusy(true);
    setRes(null);
    const r = await fetch("/api/recall", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: q }),
    });
    setRes(await r.json());
    setBusy(false);
  }

  return (
    <main style={{ maxWidth: 760 }}>
      <nav style={{ marginBottom: 24, display: "flex", gap: 16, fontSize: 14 }}>
        <Link href="/" style={{ color: "#58a6ff" }}>홈</Link>
        <Link href="/review" style={{ color: "#58a6ff" }}>검토 큐</Link>
      </nav>

      <h1>왜 그렇게 했지?</h1>
      <p style={{ color: "#7d8590", marginTop: 0 }}>
        저장된 결정에서만 답합니다. 관련 기록이 없으면 솔직히 &ldquo;기록 없음&rdquo;이라고 말합니다.
      </p>

      <form onSubmit={ask} style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="예: 왜 SQLite를 썼어?"
          style={{ flex: 1, padding: "8px 12px", borderRadius: 6, border: "1px solid #30363d",
                   background: "#0d1117", color: "#e6edf3" }}
        />
        <button disabled={busy} style={{ background: "#1f6feb", color: "white", border: "none",
                 borderRadius: 6, padding: "8px 16px", cursor: "pointer" }}>
          {busy ? "…" : "질문"}
        </button>
      </form>

      {res && (
        <div style={{ marginTop: 24, padding: "14px 16px", borderRadius: 8,
                      border: `1px solid ${res.grounded ? "#2ea04340" : "#d2992240"}`,
                      background: res.grounded ? "#0d1117" : "#1c1708" }}>
          {res.grounded ? (
            <>
              <strong>근거 있는 답변</strong>
              <pre style={{ whiteSpace: "pre-wrap", margin: "8px 0 0", fontFamily: "inherit" }}>{res.answer}</pre>
            </>
          ) : (
            <strong style={{ color: "#d29922" }}>기록 없음 — 모델을 호출하지 않았습니다.</strong>
          )}
        </div>
      )}
    </main>
  );
}
