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
    <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 10 }}>
      <button onClick={() => act("confirm")} disabled={busy} className="btn btn-green">
        승인 → 결정으로
      </button>
      <button onClick={() => act("reject")} disabled={busy} className="btn btn-gray">
        거부
      </button>
      {err && <span style={{ color: "var(--red)", fontSize: 13 }}>{err}</span>}
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
    <button onClick={seed} disabled={busy} className="btn btn-blue">
      {busy ? "추가 중…" : "데모 후보 추가 (목 추출)"}
    </button>
  );
}
