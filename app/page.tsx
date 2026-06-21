import Link from "next/link";
import { ping } from "@/lib/db/ping";
import { getDbPath } from "@/lib/db/connection";

// Server Component: node:sqlite runs only on the server, never shipped to the browser.
export default function HomePage() {
  let status: string;
  let ok = false;
  try {
    const res = ping();
    ok = res.ok;
    status = res.ok ? "SQLite 연결 OK (SELECT 1 통과)" : "쿼리는 됐으나 결과 이상";
  } catch (err) {
    status = `DB 연결 실패: ${err instanceof Error ? err.message : String(err)}`;
  }

  return (
    <main style={{ maxWidth: 640 }}>
      <h1 style={{ marginBottom: "0.25rem" }}>Knox_Dolphin</h1>
      <p style={{ color: "#7d8590", marginTop: 0 }}>
        로컬 우선 프로젝트 메모리 — 코드의 &lsquo;왜&rsquo;를 저장합니다.
      </p>

      <div
        style={{
          marginTop: "2rem",
          padding: "1rem 1.25rem",
          borderRadius: 8,
          border: `1px solid ${ok ? "#2ea04326" : "#f8514926"}`,
          background: ok ? "#2ea04314" : "#f8514914",
        }}
      >
        <strong>{ok ? "✓" : "✗"} 스캐폴딩 헬스 체크</strong>
        <p style={{ margin: "0.5rem 0 0" }}>{status}</p>
        <p style={{ margin: "0.5rem 0 0", color: "#7d8590", fontSize: "0.85rem" }}>
          DB 파일: {getDbPath()}
        </p>
      </div>

      <div style={{ marginTop: "2rem", display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Link href="/review" style={navCard}>검토 큐 →<br /><span style={navSub}>후보 승인/거부</span></Link>
        <Link href="/decisions" style={navCard}>결정 →<br /><span style={navSub}>확정된 기억</span></Link>
        <Link href="/candidates" style={navCard}>전체 후보 →<br /><span style={navSub}>추출 로그</span></Link>
        <Link href="/search" style={navCard}>검색 →<br /><span style={navSub}>왜 그렇게 했지?</span></Link>
      </div>
    </main>
  );
}

const navCard: React.CSSProperties = {
  flex: 1,
  padding: "14px 16px",
  borderRadius: 8,
  border: "1px solid #30363d",
  color: "#e6edf3",
  textDecoration: "none",
  background: "#0d1117",
};
const navSub: React.CSSProperties = { color: "#7d8590", fontSize: "0.8rem" };
