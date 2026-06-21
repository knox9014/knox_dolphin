"use client";

import { useEffect, useState } from "react";
import { Nav } from "../components/Nav";

interface Status {
  configured: boolean;
  masked: string | null;
}

// Enter / update the Anthropic API key from the UI. Saved to the local .env and
// applied immediately (no restart). The key is never shown back — only masked.
export default function SettingsPage() {
  const [status, setStatus] = useState<Status | null>(null);
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  function load() {
    fetch("/api/settings").then((r) => r.json()).then(setStatus);
  }
  useEffect(load, []);

  async function save() {
    setBusy(true); setMsg(null); setErr(null);
    const r = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey: key }),
    });
    const d = await r.json();
    setBusy(false);
    if (!r.ok) { setErr(d.error ?? "저장 실패"); return; }
    setStatus(d); setKey(""); setMsg("저장됐습니다. 이제 추출·회상에 실제 AI가 사용됩니다.");
  }

  async function clear() {
    setBusy(true); setMsg(null); setErr(null);
    const r = await fetch("/api/settings", { method: "DELETE" });
    setStatus(await r.json()); setBusy(false); setMsg("키를 삭제했습니다. 다시 목(mock) 모드로 동작합니다.");
  }

  return (
    <main>
      <Nav active="/settings" />
      <h1>설정 — Anthropic API 키</h1>
      <p className="lead">
        키를 넣으면 추출과 회상에 실제 AI가 사용됩니다. 키 없이도 앱은 동작하며(목 모드), 키는 로컬 <code>.env</code>에만 저장되고
        git이나 브라우저로 나가지 않습니다.
      </p>

      <div className="panel" style={{ marginBottom: 16 }}>
        {status?.configured ? (
          <span><span className="badge badge-green">설정됨</span> 현재 키: <code>{status.masked}</code></span>
        ) : (
          <span><span className="badge badge-amber">미설정</span> 지금은 목(mock) 모드로 동작합니다.</span>
        )}
      </div>

      <label className="faint">API 키 (sk-ant-…)</label>
      <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="sk-ant-..."
          style={{ flex: 1, minWidth: 240 }}
        />
        <button onClick={save} disabled={busy || !key.trim()} className="btn btn-green">저장</button>
        {status?.configured && (
          <button onClick={clear} disabled={busy} className="btn btn-gray">삭제</button>
        )}
      </div>

      {msg && <p className="meta" style={{ color: "var(--green)" }}>{msg}</p>}
      {err && <p className="meta" style={{ color: "var(--red)" }}>{err}</p>}

      <p className="faint" style={{ marginTop: 24 }}>
        키 발급: console.anthropic.com → API Keys. 사용한 만큼 본인 계정에 과금됩니다(회상/추출 1회당 보통 수 센트).
      </p>
    </main>
  );
}
