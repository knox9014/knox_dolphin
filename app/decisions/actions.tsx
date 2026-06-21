"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export interface ReplacementOption {
  id: number;
  decision: string;
}

// Lets a human mark a confirmed decision as superseded by another. The old record
// is never deleted — only flagged (invariant #6).
export function SupersedeControl({
  oldId,
  options,
}: {
  oldId: number;
  options: ReplacementOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [newId, setNewId] = useState<number | "">("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (newId === "") return;
    setBusy(true);
    setErr(null);
    const res = await fetch("/api/supersede", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oldId, newId }),
    });
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      setErr(b.error ?? "failed");
      setBusy(false);
      return;
    }
    router.refresh();
  }

  if (options.length === 0) return null;

  return (
    <div style={{ marginTop: 8 }}>
      {!open ? (
        <button onClick={() => setOpen(true)} style={link}>
          이 결정을 대체됨으로 표시
        </button>
      ) : (
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, color: "#7d8590" }}>대체한 결정:</span>
          <select
            value={newId}
            onChange={(e) => setNewId(e.target.value === "" ? "" : Number(e.target.value))}
            style={select}
          >
            <option value="">선택…</option>
            {options.map((o) => (
              <option key={o.id} value={o.id}>
                #{o.id} {o.decision.slice(0, 40)}
              </option>
            ))}
          </select>
          <button onClick={submit} disabled={busy || newId === ""} style={btn}>
            확인
          </button>
          <button onClick={() => setOpen(false)} style={link}>
            취소
          </button>
          {err && <span style={{ color: "#f85149", fontSize: 12 }}>{err}</span>}
        </div>
      )}
    </div>
  );
}

const link: React.CSSProperties = {
  background: "none", border: "none", color: "#8b949e", cursor: "pointer",
  fontSize: 12, textDecoration: "underline", padding: 0,
};
const select: React.CSSProperties = {
  background: "#0d1117", color: "#e6edf3", border: "1px solid #30363d",
  borderRadius: 6, padding: "4px 8px", fontSize: 13,
};
const btn: React.CSSProperties = {
  background: "#d29922", color: "#0d1117", border: "none", borderRadius: 6,
  padding: "4px 12px", cursor: "pointer", fontSize: 13, fontWeight: 600,
};
