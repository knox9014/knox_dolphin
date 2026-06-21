import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

// Discover local Claude Code logs. We only ever read these files transiently
// (list metadata, parse on demand) — raw transcripts are never persisted (#5).

export interface LogFileInfo {
  path: string;
  project: string; // the .claude project folder name
  file: string; // jsonl filename
  sizeBytes: number;
  modified: string;
}

function projectsRoot(): string {
  return join(homedir(), ".claude", "projects");
}

/** List all .jsonl logs under ~/.claude/projects, newest first. */
export function listLogFiles(): LogFileInfo[] {
  const root = projectsRoot();
  const out: LogFileInfo[] = [];

  let projects: string[];
  try {
    projects = readdirSync(root);
  } catch {
    return out; // no .claude dir → nothing to list
  }

  for (const project of projects) {
    const dir = join(root, project);
    let entries: string[];
    try {
      if (!statSync(dir).isDirectory()) continue;
      entries = readdirSync(dir);
    } catch {
      continue;
    }
    for (const file of entries) {
      if (!file.endsWith(".jsonl")) continue;
      const path = join(dir, file);
      try {
        const st = statSync(path);
        out.push({
          path,
          project,
          file,
          sizeBytes: st.size,
          modified: st.mtime.toISOString(),
        });
      } catch {
        /* skip unreadable */
      }
    }
  }

  return out.sort((a, b) => b.modified.localeCompare(a.modified));
}
