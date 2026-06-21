"use client";

import { useState } from "react";
import { Nav } from "../components/Nav";

interface RecallResponse {
  answer: string;
  grounded: boolean;
  records: {
    id: number;
    decision: string;
    source_quote: string;
    status: string;
    superseded_by: number | null;
  }[];
}

// Recall UI. Ask "why did we…" and get an answer grounded ONLY in stored
// decisions, or an honest "기록 없음".
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
    <main>
      <Nav active="/search" />
      <h1>왜 그렇게 했지?</h1>
      <p className="lead">
        저장된 결정에서만 답합니다. 관련 기록이 없으면 솔직히 &ldquo;기록 없음&rdquo;이라고 말합니다.
      </p>

      <form onSubmit={ask} style={{ display: "flex", gap: 8 }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="예: 왜 SQLite를 썼어?"
          style={{ flex: 1 }}
        />
        <button disabled={busy} className="btn btn-blue">{busy ? "…" : "질문"}</button>
      </form>

      {res && (
        <div className={`panel ${res.grounded ? "panel-ok" : "panel-warn"}`} style={{ marginTop: "1.5rem" }}>
          {res.grounded ? (
            <>
              <strong>근거 있는 답변</strong>
              <pre style={{ whiteSpace: "pre-wrap", margin: "8px 0 0", fontFamily: "inherit" }}>{res.answer}</pre>
              <div style={{ marginTop: 14, borderTop: "1px solid var(--border-soft)", paddingTop: 10 }}>
                <span className="faint">근거 레코드</span>
                {res.records.map((r) => (
                  <div key={r.id} style={{ marginTop: 6, fontSize: 13 }}>
                    <span className={`badge ${r.status === "superseded" ? "badge-amber" : "badge-green"}`}>
                      {r.status === "superseded" ? "대체됨" : "확정"}
                    </span>{" "}
                    <strong>#{r.id}</strong> {r.decision}
                    {r.status === "superseded" && r.superseded_by != null && (
                      <span style={{ color: "var(--amber)" }}> → #{r.superseded_by}</span>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <strong style={{ color: "var(--amber)" }}>기록 없음 — 모델을 호출하지 않았습니다.</strong>
          )}
        </div>
      )}
    </main>
  );
}
