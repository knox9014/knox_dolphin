import { listAllCandidates } from "@/lib/db/read-repo";
import { getActiveProjectId } from "@/lib/active-project";
import { Nav } from "../components/Nav";

export const dynamic = "force-dynamic";

// The full extraction log: every candidate ever produced, in any review state.
// Fabricated quotes never reach here — the substring guard drops them before insert.
export default async function CandidatesPage() {
  const projectId = await getActiveProjectId();
  const candidates = listAllCandidates(projectId);

  return (
    <main>
      <Nav active="/candidates" />
      <h1>전체 후보 (추출 로그)</h1>
      <p className="lead">
        추출기가 뽑은 모든 후보입니다. 출처가 없거나 지어낸 인용은 애초에 여기 들어오지 못합니다.
      </p>

      {candidates.length === 0 ? (
        <p className="empty">후보가 없습니다. &lsquo;내 로그&rsquo;에서 추출하거나 검토 큐에서 데모 후보를 추가하세요.</p>
      ) : (
        <ul className="list">
          {candidates.map((c) => (
            <li key={c.id} className="card">
              <div className="card-row">
                <span className="card-title">#{c.id} {c.decision}</span>
                <span className={`badge ${c.reviewed ? "badge-gray" : "badge-blue"}`}>
                  {c.reviewed ? "검토됨" : "대기"}
                </span>
              </div>
              {c.reason && <p className="meta">이유: {c.reason}</p>}
              <p className="meta">출처: <span className="quote">&ldquo;{c.source_quote}&rdquo;</span> · {c.speaker}</p>
              <p className="faint" style={{ marginTop: 6 }}>추출: {c.extracted_at}</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
