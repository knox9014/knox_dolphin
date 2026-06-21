import { NextResponse } from "next/server";
import { listLogFiles } from "@/lib/claude-code-logs/list";

export const runtime = "nodejs";

// List local Claude Code logs (metadata only — no transcript content leaves disk).
export async function GET() {
  const logs = listLogFiles().slice(0, 100); // cap for the UI
  return NextResponse.json({
    logs: logs.map((l) => ({
      path: l.path,
      project: l.project,
      file: l.file,
      sizeKB: Math.round(l.sizeBytes / 1024),
      modified: l.modified,
    })),
  });
}
