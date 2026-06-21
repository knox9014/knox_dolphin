import { NextResponse } from "next/server";
import { listLogFiles } from "@/lib/claude-code-logs/list";
import { summarizeLog } from "@/lib/claude-code-logs/summary";

export const runtime = "nodejs";

// List local Claude Code logs with a human summary (title, working dir, counts).
// Metadata only — no transcript content leaves disk.
export async function GET() {
  const logs = listLogFiles().slice(0, 100);
  return NextResponse.json({
    logs: logs.map((l) => {
      const s = summarizeLog(l.path);
      return {
        path: l.path,
        file: l.file,
        sizeKB: Math.round(l.sizeBytes / 1024),
        modified: l.modified,
        title: s.title,
        cwdName: s.cwdName,
        cwd: s.cwd,
        developerMsgs: s.developerMsgs,
        assistantMsgs: s.assistantMsgs,
        preview: s.firstUserPreview,
      };
    }),
  });
}
