import { ensureDefaultProject, listPendingCandidates } from "@/lib/db/read-repo";
import { Nav } from "../components/Nav";
import { CandidateActions, SeedButton } from "./actions";

export const dynamic = "force-dynamic"; // always read fresh from the DB

// Review queue = the confirmation gate's UI. Pending candidates wait here until a
// human approves (→ decisions) or rejects. The only path into the sanctuary.
export default function ReviewPage() {
  const projectId = ensureDefaultProject();
  const pending = listPendingCandidates(projectId);

  return (
    <main>
      <Nav active="/review" />
      <h1>검토 큐</h1>
      <p className="lead">
        추출된 후보입니다. 승인한 것만 결정(성역)으로 들어갑니다. 출처 없는 후보는 애초에 여기 오지 못합니다.
      </p>
      <SeedButton />

      {pending.length === 0 ? (
        <p className="empty">대기 중인 후보가 없습니다.</p>
      ) : (
        <ul className="list">
          {pending.map((c) => (
            <li key={c.id} className="card">
              <span className="card-title">{c.decision}</span>
              {c.reason && <p className="meta">이유: {c.reason}</p>}
              <p className="meta">출처: <span className="quote">&ldquo;{c.source_quote}&rdquo;</span> · {c.speaker}</p>
              <CandidateActions candidateId={c.id} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
