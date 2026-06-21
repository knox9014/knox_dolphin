import Link from "next/link";
import { ensureDefaultProject, listAllCandidates } from "@/lib/db/read-repo";

export const dynamic = "force-dynamic";

// The full extraction log: every candidate the extractor ever produced, in any
// review state. Fabricated quotes never reach here — the substring guard drops
// them before insert — so this is also a record of what passed the trust gate.
export default function CandidatesPage() {
  const projectId = ensureDefaultProject();
  const candidates = listAllCandidates(projectId);

  return (
    <main style={{ maxWidth: 760 }}>
      <nav style={{ marginBottom: 24, display: "flex", gap: 16, fontSize: 14 }}>
        <Link href="/" style={{ color: "#58a6ff" }}>홈</Link>
        <Link href="/review" style={{ color: "#58a6ff" }}>검토 큐</Link>
        <Link href="/decisions" style={{ color: "#58a6ff" }}>결정</Link>
        <Link href="/search" style={{ color: "#58a6ff" }}>검색</Link>
      </nav>

      <h1>전체 후보 (추출 로그)</h1>
      <p style={{ color: "#7d8590", marginTop: 0 }}>
        추출기가 뽑은 모든 후보입니다. 대기/검토됨 상태를 함께 보여줍니다. 출처가 없거나 지어낸 인용은 애초에 여기 들어오지 못합니다.
      </p>

      {candidates.length === 0 ? (
        <p style={{ marginTop: 24, color: "#7d8590" }}>후보가 없습니다. 검토 큐에서 &ldquo;데모 후보 추가&rdquo;를 눌러보세요.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, marginTop: 24 }}>
          {candidates.map((c) => (
            <li key={c.id} style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <strong style={{ fontSize: 15 }}>#{c.id} {c.decision}</strong>
                <span style={badge(c.reviewed)}>{c.reviewed ? "검토됨" : "대기"}</span>
              </div>
              {c.reason && <p style={meta}>이유: {c.reason}</p>}
              <p style={{ ...meta, color: "#8b949e" }}>
                출처: <span style={{ fontStyle: "italic" }}>&ldquo;{c.source_quote}&rdquo;</span> · {c.speaker}
              </p>
              <p style={{ ...meta, color: "#6e7681", fontSize: 12 }}>추출: {c.extracted_at}</p>
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
function badge(reviewed: number): React.CSSProperties {
  const done = reviewed === 1;
  return {
    fontSize: 12, padding: "2px 8px", borderRadius: 12,
    background: done ? "#6e768126" : "#1f6feb26", color: done ? "#8b949e" : "#58a6ff",
  };
}
