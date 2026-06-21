import Link from "next/link";
import { ensureDefaultProject, listPendingCandidates } from "@/lib/db/read-repo";
import { CandidateActions, SeedButton } from "./actions";

export const dynamic = "force-dynamic"; // always read fresh from the DB

// Review queue = the confirmation gate's UI. Pending candidates wait here until a
// human approves (→ decisions) or rejects. This is the only path into the sanctuary.
export default function ReviewPage() {
  const projectId = ensureDefaultProject();
  const pending = listPendingCandidates(projectId);

  return (
    <main style={{ maxWidth: 760 }}>
      <nav style={{ marginBottom: 24, display: "flex", gap: 16, fontSize: 14 }}>
        <Link href="/" style={{ color: "#58a6ff" }}>홈</Link>
        <Link href="/decisions" style={{ color: "#58a6ff" }}>결정</Link>
        <Link href="/candidates" style={{ color: "#58a6ff" }}>전체 후보</Link>
        <Link href="/search" style={{ color: "#58a6ff" }}>검색</Link>
      </nav>

      <h1>검토 큐</h1>
      <p style={{ color: "#7d8590", marginTop: 0 }}>
        추출된 후보입니다. 승인한 것만 결정(성역)으로 들어갑니다. 출처 없는 후보는 애초에 여기 오지 못합니다.
      </p>
      <SeedButton />

      {pending.length === 0 ? (
        <p style={{ marginTop: 24, color: "#7d8590" }}>대기 중인 후보가 없습니다.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, marginTop: 24 }}>
          {pending.map((c) => (
            <li key={c.id} style={card}>
              <strong style={{ fontSize: 16 }}>{c.decision}</strong>
              {c.reason && <p style={meta}>이유: {c.reason}</p>}
              <p style={{ ...meta, color: "#8b949e" }}>
                출처: <span style={{ fontStyle: "italic" }}>&ldquo;{c.source_quote}&rdquo;</span> · {c.speaker}
              </p>
              <CandidateActions candidateId={c.id} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

const card: React.CSSProperties = {
  border: "1px solid #30363d",
  borderRadius: 8,
  padding: "14px 16px",
  marginBottom: 12,
  background: "#0d1117",
};
const meta: React.CSSProperties = { margin: "6px 0 0", fontSize: 13, color: "#adbac7" };
