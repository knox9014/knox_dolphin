import { NextResponse } from "next/server";
import { parseLog } from "@/lib/claude-code-logs/parse";
import { extract } from "@/core/extractor/extract";
import { heuristicProvider } from "@/core/extractor/heuristic-provider";
import { saveCandidates } from "@/lib/db/candidates-repo";
import { getActiveProjectId } from "@/lib/active-project";
import { listLogFiles as discover } from "@/lib/claude-code-logs/list";

export const runtime = "nodejs";

// Parse a chosen real log → surface candidates (heuristic, key-free) → persist to
// `candidates` only. The substring guard still runs inside extract(); raw
// transcript is never stored.
export async function POST(req: Request) {
  const { path } = (await req.json()) as { path?: string };
  if (!path) return NextResponse.json({ error: "path required" }, { status: 400 });

  // Only allow paths that actually appear in the discovered log list (no arbitrary reads).
  const allowed = discover().some((l) => l.path === path);
  if (!allowed) return NextResponse.json({ error: "unknown log path" }, { status: 403 });

  const log = parseLog(path);
  const { kept, discarded } = await extract(log, heuristicProvider);

  const projectId = await getActiveProjectId();
  const saved = saveCandidates(projectId, log.sessionId, kept);

  return NextResponse.json({
    messages: log.messages.length,
    proposed: kept.length + discarded.length,
    saved,
    discarded: discarded.length,
  });
}
