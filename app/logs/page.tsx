"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface LogInfo {
  path: string;
  project: string;
  file: string;
  sizeKB: number;
  modified: string;
}
interface ExtractResult {
  messages: number;
  proposed: number;
  saved: number;
  discarded: number;
}

// Pick a real local Claude Code log and surface candidates from it (key-free
// heuristic). Results land in the review queue for human approval.
export default function LogsPage() {
  const [logs, setLogs] = useState<LogInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyPath, setBusyPath] = useState<string | null>(null);
  const [result, setResult] = useState<(ExtractResult & { file: string }) | null>(null);

  useEffect(() => {
    fetch("/api/logs")
      .then((r) => r.json())
      .then((d) => setLogs(d.logs ?? []))
      .finally(() => setLoading(false));
  }, []);

  async function extract(log: LogInfo) {
    setBusyPath(log.path);
    setResult(null);
    const r = await fetch("/api/extract-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: log.path }),
    });
    const d = await r.json();
    setBusyPath(null);
    if (r.ok) setResult({ ...d, file: log.file });
  }

  return (
    <main style={{ maxWidth: 820 }}>
      <nav style={{ marginBottom: 24, display: "flex", gap: 16, fontSize: 14 }}>
        <Link href="/" style={{ color: "#58a6ff" }}>홈</Link>
        <Link href="/review" style={{ color: "#58a6ff" }}>검토 큐</Link>
        <Link href="/decisions" style={{ color: "#58a6ff" }}>결정</Link>
      </nav>

      <h1>내 Claude Code 로그</h1>
      <p style={{ color: "#7d8590", marginTop: 0 }}>
        로컬 <code>.claude</code> 로그입니다. 하나를 골라 추출하면 개발자 발화가 후보로 surface되어 검토 큐로 갑니다.
        원문은 저장하지 않습니다. (지금은 키 없는 휴리스틱 — 키를 넣으면 LLM 추출로 교체됩니다.)
      </p>

      {result && (
        <div style={{ margin: "16px 0", padding: "12px 14px", borderRadius: 8,
                      border: "1px solid #2ea04340", background: "#0d1117" }}>
          <strong>{result.file}</strong> 추출 완료 — 메시지 {result.messages}개 중
          후보 {result.saved}개 저장{result.discarded ? `, ${result.discarded}개 폐기` : ""}.{" "}
          <Link href="/review" style={{ color: "#58a6ff" }}>검토 큐에서 확인 →</Link>
        </div>
      )}

      {loading ? (
        <p style={{ color: "#7d8590" }}>불러오는 중…</p>
      ) : logs.length === 0 ? (
        <p style={{ color: "#7d8590" }}>~/.claude/projects 에서 로그를 찾지 못했습니다.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, marginTop: 16 }}>
          {logs.map((l) => (
            <li key={l.path} style={row}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {l.file}
                </div>
                <div style={{ fontSize: 12, color: "#6e7681" }}>
                  {l.project} · {l.sizeKB}KB · {new Date(l.modified).toLocaleString()}
                </div>
              </div>
              <button onClick={() => extract(l)} disabled={busyPath !== null} style={btn}>
                {busyPath === l.path ? "추출 중…" : "추출"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

const row: React.CSSProperties = {
  display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12,
  border: "1px solid #30363d", borderRadius: 8, padding: "10px 14px", marginBottom: 8,
  background: "#0d1117",
};
const btn: React.CSSProperties = {
  background: "#1f6feb", color: "white", border: "none", borderRadius: 6,
  padding: "6px 14px", cursor: "pointer", fontSize: 13, whiteSpace: "nowrap",
};
