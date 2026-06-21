import Link from "next/link";
import { ping } from "@/lib/db/ping";
import { getDbPath } from "@/lib/db/connection";
import { Nav } from "./components/Nav";

// Server Component: node:sqlite runs only on the server, never shipped to the browser.
export default function HomePage() {
  let status: string;
  let ok = false;
  try {
    const res = ping();
    ok = res.ok;
    status = res.ok ? "SQLite 연결 OK" : "쿼리는 됐으나 결과 이상";
  } catch (err) {
    status = `DB 연결 실패: ${err instanceof Error ? err.message : String(err)}`;
  }

  return (
    <main>
      <Nav active="/" />
      <h1>Knox_Dolphin</h1>
      <p className="lead">로컬 우선 프로젝트 메모리 — 코드의 &lsquo;왜&rsquo;를 저장합니다.</p>

      <div className={`panel ${ok ? "panel-ok" : "panel-warn"}`}>
        <strong>{ok ? "✓" : "✗"} {status}</strong>
        <p className="faint" style={{ margin: "6px 0 0" }}>DB 파일: {getDbPath()}</p>
      </div>

      <div className="tiles">
        <Link href="/logs" className="tile"><b>내 로그 →</b><span>실제 로그에서 추출</span></Link>
        <Link href="/review" className="tile"><b>검토 큐 →</b><span>후보 승인/거부</span></Link>
        <Link href="/decisions" className="tile"><b>결정 →</b><span>확정된 기억</span></Link>
        <Link href="/candidates" className="tile"><b>전체 후보 →</b><span>추출 로그</span></Link>
        <Link href="/search" className="tile"><b>검색 →</b><span>왜 그렇게 했지?</span></Link>
      </div>

      <p className="faint" style={{ marginTop: "2.5rem" }}>
        흐름: 내 로그에서 추출 → 검토 큐에서 승인 → 결정(성역)에 저장 → 검색으로 회상.
        출처 없는 결정은 저장되지 않고, 기록이 없으면 &ldquo;기록 없음&rdquo;이라 답합니다.
      </p>
    </main>
  );
}
