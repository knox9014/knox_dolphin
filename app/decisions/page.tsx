import { ensureDefaultProject, listDecisions } from "@/lib/db/read-repo";
import { Nav } from "../components/Nav";
import { SupersedeControl } from "./actions";

export const dynamic = "force-dynamic";

// The sanctuary, read-only. Every row here was human-approved and carries its source_quote.
export default function DecisionsPage() {
  const projectId = ensureDefaultProject();
  const decisions = listDecisions(projectId);
  const replacements = decisions
    .filter((d) => d.status === "confirmed")
    .map((d) => ({ id: d.id, decision: d.decision }));

  return (
    <main>
      <Nav active="/decisions" />
      <h1>결정 (성역)</h1>
      <p className="lead">사람이 승인한 확정 결정입니다. 각 결정엔 출처가 따라옵니다 — 프로젝트 기억의 본체입니다.</p>

      {decisions.length === 0 ? (
        <p className="empty">아직 확정된 결정이 없습니다. 검토 큐에서 후보를 승인하세요.</p>
      ) : (
        <ul className="list">
          {decisions.map((d) => (
            <li key={d.id} className="card">
              <div className="card-row">
                <span className="card-title">#{d.id} {d.decision}</span>
                <span className={`badge ${d.status === "confirmed" ? "badge-green" : "badge-amber"}`}>
                  {d.status === "confirmed" ? "확정" : "대체됨"}
                </span>
              </div>
              {d.reason && <p className="meta">이유: {d.reason}</p>}
              <p className="meta">출처: <span className="quote">&ldquo;{d.source_quote}&rdquo;</span></p>
              <p className="faint" style={{ marginTop: 6 }}>확정: {d.confirmed_at}</p>
              {d.status === "superseded" && d.superseded_by != null ? (
                <p className="meta" style={{ color: "var(--amber)" }}>→ #{d.superseded_by} 결정으로 대체됨 (기록 보존)</p>
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
