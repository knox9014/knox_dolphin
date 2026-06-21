"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

export interface LogInfo {
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
  saved: number;
  discarded: number;
  title?: string | null;
}

// Filter + extract UI. Defaults to showing only the active project's logs when
// any match exists; otherwise shows all (so you're never stuck on an empty list).
export function LogsView({ logs, activeName }: { logs: LogInfo[]; activeName: string | null }) {
  const belongs = (l: LogInfo) => !!activeName && l.cwdName === activeName;
  const mineCount = useMemo(() => logs.filter(belongs).length, [logs, activeName]); // eslint-disable-line react-hooks/exhaustive-deps
  const hasMatches = mineCount > 0;

  const [filter, setFilter] = useState("");
  const [showAll, setShowAll] = useState(false); // when matches exist, default to project-only
  const [busyPath, setBusyPath] = useState<string | null>(null);
  const [result, setResult] = useState<(ExtractResult & { file: string }) | null>(null);

  const projectOnly = hasMatches && !showAll;

  const shown = useMemo(() => {
    let list = logs;
    if (projectOnly) list = list.filter(belongs);
    const q = filter.trim().toLowerCase();
    if (q) list = list.filter((l) => [l.title, l.cwdName, l.preview, l.file].some((s) => s?.toLowerCase().includes(q)));
    return [...list].sort((a, b) => Number(belongs(b)) - Number(belongs(a)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logs, filter, projectOnly, activeName]);

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
    if (r.ok) setResult({ ...d, file: log.file, title: log.title });
  }

  return (
    <>
      {activeName && (
        <div className="panel" style={{ marginBottom: 14, fontSize: 14 }}>
          추출 대상 프로젝트: <strong>📁 {activeName}</strong>
          {projectOnly ? (
            <span className="faint"> — 이 프로젝트와 연결된 로그만 보여줍니다.</span>
          ) : hasMatches ? (
            <span className="faint"> — 전체 로그를 보여줍니다.</span>
          ) : (
            <span className="faint"> — 이 프로젝트와 폴더명이 같은 로그가 없어 전체를 보여줍니다. 추출하면 이 프로젝트로 들어갑니다.</span>
          )}
        </div>
      )}

      {result && (
        <div className="panel panel-ok" style={{ marginBottom: "1.25rem" }}>
          <strong>{result.title ?? result.file}</strong> 추출 완료 — 메시지 {result.messages}개 중 후보 {result.saved}개 저장
          {result.discarded ? `, ${result.discarded}개 폐기` : ""}.{" "}
          <Link href="/review">검토 큐에서 확인 →</Link>
        </div>
      )}

      {logs.length > 0 && (
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 14, flexWrap: "wrap" }}>
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="제목·폴더·내용으로 검색…"
            style={{ flex: 1, minWidth: 200 }}
          />
          {hasMatches && (
            <label className="faint" style={{ display: "flex", gap: 6, alignItems: "center", cursor: "pointer", whiteSpace: "nowrap" }}>
              <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} style={{ width: "auto" }} />
              전체 로그 보기 ({logs.length})
            </label>
          )}
        </div>
      )}

      {shown.length === 0 ? (
        <p className="empty">
          {logs.length === 0 ? "~/.claude/projects 에서 로그를 찾지 못했습니다." : "조건에 맞는 로그가 없습니다."}
        </p>
      ) : (
        <ul className="list">
          {shown.map((l) => (
            <li key={l.path} className="card" style={belongs(l) ? { borderColor: "#2ea04366" } : undefined}>
              <div className="card-row">
                <span className="card-title">{l.title ?? "(제목 없는 세션)"}</span>
                <button onClick={() => extract(l)} disabled={busyPath !== null} className="btn btn-blue">
                  {busyPath === l.path ? "추출 중…" : "추출"}
                </button>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginTop: 6 }}>
                {belongs(l) && <span className="badge badge-green">현재 프로젝트</span>}
                {l.cwdName && <span className="badge badge-gray" title={l.cwd ?? undefined}>📁 {l.cwdName}</span>}
                <span className="faint">💬 개발자 {l.developerMsgs} · AI {l.assistantMsgs}</span>
                <span className="faint">· {new Date(l.modified).toLocaleString()}</span>
              </div>
              {l.preview && <p className="meta" style={{ color: "#8b949e" }}>{l.preview}</p>}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
