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
    </main>
  );
}
