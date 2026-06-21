import Link from "next/link";
import { ensureDefaultProject, listDecisions } from "@/lib/db/read-repo";
import { SupersedeControl } from "./actions";

export const dynamic = "force-dynamic";

// The sanctuary, read-only. This is the project's confirmed memory — every row
// here was human-approved and carries its source_quote.
export default function DecisionsPage() {
  const projectId = ensureDefaultProject();
  const decisions = listDecisions(projectId);
  // A decision can only be superseded by another *confirmed* one.
  const replacements = decisions
    .filter((d) => d.status === "confirmed")
    .map((d) => ({ id: d.id, decision: d.decision }));

  return (
    <main style={{ maxWidth: 760 }}>
      <nav style={{ marginBottom: 24, display: "flex", gap: 16, fontSize: 14 }}>
        <Link href="/" style={{ color: "#58a6ff" }}>홈</Link>
        <Link href="/review" style={{ color: "#58a6ff" }}>검토 큐</Link>
        <Link href="/candidates" style={{ color: "#58a6ff" }}>전체 후보</Link>
        <Link href="/search" style={{ color: "#58a6ff" }}>검색</Link>
      </nav>

      <h1>결정 (성역)</h1>
      <p style={{ color: "#7d8590", marginTop: 0 }}>
        사람이 승인한 확정 결정입니다. 각 결정엔 출처가 따라옵니다. 이것이 프로젝트의 기억 본체입니다.
      </p>

      {decisions.length === 0 ? (
        <p style={{ marginTop: 24, color: "#7d8590" }}>아직 확정된 결정이 없습니다. 검토 큐에서 승인하세요.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, marginTop: 24 }}>
          {decisions.map((d) => (
            <li key={d.id} style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <strong style={{ fontSize: 16 }}>#{d.id} {d.decision}</strong>
                <span style={badge(d.status)}>{d.status}</span>
              </div>
              {d.reason && <p style={meta}>이유: {d.reason}</p>}
              <p style={{ ...meta, color: "#8b949e" }}>
                출처: <span style={{ fontStyle: "italic" }}>&ldquo;{d.source_quote}&rdquo;</span>
              </p>
              <p style={{ ...meta, color: "#6e7681", fontSize: 12 }}>확정: {d.confirmed_at}</p>
              {d.status === "superseded" && d.superseded_by != null ? (
                <p style={{ ...meta, color: "#d29922", fontSize: 13 }}>
                  → #{d.superseded_by} 결정으로 대체됨 (기록은 보존)
                </p>
              ) : (
                <SupersedeControl oldId={d.id} options={replacements.filter((r) => r.id !== d.id)} />
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

const card: React.CSSProperties = {
  border: "1px solid #30363d", borderRadius: 8, padding: "14px 16px",
  marginBottom: 12, background: "#0d1117",
};
const meta: React.CSSProperties = { margin: "6px 0 0", fontSize: 13, color: "#adbac7" };
function badge(status: string): React.CSSProperties {
  const ok = status === "confirmed";
  return {
    fontSize: 12, padding: "2px 8px", borderRadius: 12,
    background: ok ? "#2ea04326" : "#d2992226", color: ok ? "#3fb950" : "#d29922",
  };
}
