"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Nav } from "../components/Nav";

interface LogInfo {
  path: string;
  file: string;
  sizeKB: number;
  modified: string;
  title: string | null;
  cwdName: string | null;
  cwd: string | null;
  developerMsgs: number;
  assistantMsgs: number;
  preview: string | null;
}
interface ExtractResult {
  messages: number;
  proposed: number;
  saved: number;
  discarded: number;
}

// Pick a real local Claude Code log and surface candidates from it (key-free
// heuristic). Each log is shown by its title / working folder so it's clear what
// the conversation was about, not a bare UUID.
export default function LogsPage() {
  const [logs, setLogs] = useState<LogInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyPath, setBusyPath] = useState<string | null>(null);
  const [result, setResult] = useState<(ExtractResult & { file: string }) | null>(null);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    fetch("/api/logs")
      .then((r) => r.json())
      .then((d) => setLogs(d.logs ?? []))
      .finally(() => setLoading(false));
  }, []);

  const shown = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return logs;
    return logs.filter((l) =>
      [l.title, l.cwdName, l.preview, l.file].some((s) => s?.toLowerCase().includes(q))
    );
  }, [logs, filter]);

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
    <main>
      <Nav active="/logs" />
      <h1>내 Claude Code 로그</h1>
      <p className="lead">
        로컬 <code>.claude</code> 대화 기록입니다. 하나를 골라 <b>추출</b>하면 결정으로 보이는 발화가 후보로 검토 큐에 올라갑니다.
        원문은 저장하지 않습니다.
      </p>

      {result && (
        <div className="panel panel-ok" style={{ marginBottom: "1.25rem" }}>
          <strong>{result.title ?? result.file}</strong> 추출 완료 — 메시지 {result.messages}개 중 후보 {result.saved}개 저장
          {result.discarded ? `, ${result.discarded}개 폐기` : ""}.{" "}
          <Link href="/review">검토 큐에서 확인 →</Link>
        </div>
      )}

      {!loading && logs.length > 0 && (
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="제목·폴더·내용으로 검색…"
          style={{ width: "100%", marginBottom: 14 }}
        />
      )}

      {loading ? (
        <p className="empty">불러오는 중…</p>
      ) : shown.length === 0 ? (
        <p className="empty">{logs.length === 0 ? "~/.claude/projects 에서 로그를 찾지 못했습니다." : "검색 결과가 없습니다."}</p>
      ) : (
        <ul className="list">
          {shown.map((l) => (
            <li key={l.path} className="card">
              <div className="card-row">
                <span className="card-title">{l.title ?? "(제목 없는 세션)"}</span>
                <button onClick={() => extract(l)} disabled={busyPath !== null} className="btn btn-blue">
                  {busyPath === l.path ? "추출 중…" : "추출"}
                </button>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginTop: 6 }}>
                {l.cwdName && <span className="badge badge-gray" title={l.cwd ?? undefined}>📁 {l.cwdName}</span>}
                <span className="faint">💬 개발자 {l.developerMsgs} · AI {l.assistantMsgs}</span>
                <span className="faint">· {new Date(l.modified).toLocaleString()}</span>
              </div>
              {l.preview && <p className="meta" style={{ color: "#8b949e" }}>{l.preview}</p>}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
