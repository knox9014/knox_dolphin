import { NextResponse } from "next/server";
import type { ParsedLog } from "@/lib/claude-code-logs/types";
import { extract } from "@/core/extractor/extract";
import { mockProvider } from "@/core/extractor/mock-provider";
import type { RawCandidate } from "@/core/extractor/provider";
import { saveCandidates } from "@/lib/db/candidates-repo";
import { getActiveProjectId } from "@/lib/active-project";

export const runtime = "nodejs";

// Demo seed: simulates one extraction run so the review queue has something to
// review — without any API key. Includes a fabricated quote to prove the guard
// drops it (it will NOT appear in the queue).
export async function POST() {
  const projectId = await getActiveProjectId();

  const log: ParsedLog = {
    sessionId: "demo-session",
    messages: [
      { speaker: "developer", text: "로컬 우선으로 가자. 데이터가 기기를 안 떠나야 신뢰가 진짜가 돼.", timestamp: null },
      { speaker: "developer", text: "DB는 SQLite로. 설치할 서버가 없어야 마찰이 적어.", timestamp: null },
      { speaker: "assistant", text: "좋습니다. node:sqlite 내장으로 가면 네이티브 빌드도 없습니다.", timestamp: null },
    ],
  };

  const candidates: RawCandidate[] = [
    { decision: "로컬 우선 배포", reason: "데이터가 기기를 떠나지 않아 신뢰가 진짜가 됨",
      alternatives: null, rejected_because: null, impact: null,
      source_quote: "로컬 우선으로 가자. 데이터가 기기를 안 떠나야 신뢰가 진짜가 돼.", speaker: "developer" },
    { decision: "SQLite 사용", reason: "설치할 서버가 없어 마찰이 적음",
      alternatives: null, rejected_because: null, impact: null,
      source_quote: "DB는 SQLite로. 설치할 서버가 없어야 마찰이 적어.", speaker: "developer" },
    // fabricated — not in the log; guard must discard it
    { decision: "Kafka 도입", reason: "확장성", alternatives: null, rejected_because: null,
      impact: null, source_quote: "메시지 큐로 Kafka를 쓰기로 했다.", speaker: "developer" },
  ];

  const { kept, discarded } = await extract(log, mockProvider(candidates));
  const saved = saveCandidates(projectId, log.sessionId, kept);

  return NextResponse.json({ saved, discarded: discarded.length });
}
