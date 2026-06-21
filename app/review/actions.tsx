"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// Client-side buttons for the review queue. They call /api/confirm and then
// refresh the server component so the list reflects the new state.
export function CandidateActions({ candidateId }: { candidateId: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function act(action: "confirm" | "reject") {
    setBusy(true);
    setErr(null);
    const res = await fetch("/api/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidateId, action }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setErr(body.error ?? "failed");
      setBusy(false);
      return;
    }
    router.refresh();
  }

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
      <button onClick={() => act("confirm")} disabled={busy} style={btn("#2ea043")}>
        승인 → 결정으로
      </button>
      <button onClick={() => act("reject")} disabled={busy} style={btn("#6e7681")}>
        거부
      </button>
      {err && <span style={{ color: "#f85149", fontSize: 13 }}>{err}</span>}
    </div>
  );
}

export function SeedButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function seed() {
    setBusy(true);
    await fetch("/api/seed", { method: "POST" });
    router.refresh();
    setBusy(false);
  }
  return (
    <button onClick={seed} disabled={busy} style={btn("#1f6feb")}>
      {busy ? "추가 중…" : "데모 후보 추가 (목 추출)"}
    </button>
  );
}

function btn(bg: string): React.CSSProperties {
  return {
    background: bg,
    color: "white",
    border: "none",
    borderRadius: 6,
    padding: "6px 12px",
    cursor: "pointer",
    fontSize: 13,
  };
}
