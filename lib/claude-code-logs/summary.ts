import { readFileSync } from "node:fs";
import { basename } from "node:path";

// A human-friendly summary of one .claude log, so the UI can show "what was this
// conversation" instead of a bare UUID filename. Single pass, metadata only —
// no transcript is stored.

export interface LogSummary {
  title: string | null; // Claude Code's generated session title (aiTitle)
  cwd: string | null; // the working directory the session ran in
  cwdName: string | null; // last path segment of cwd (a readable project name)
  developerMsgs: number;
  assistantMsgs: number;
  firstUserPreview: string | null;
}

const WRAPPER = ["<scheduled-task", "<system-reminder", "<command-", "<local-command", "<budget"];

function textOf(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .filter((b) => b && typeof b === "object" && (b as { type?: string }).type === "text")
      .map((b) => (b as { text: string }).text)
      .join(" ");
  }
  return "";
}

export function summarizeLog(path: string): LogSummary {
  let raw = "";
  try {
    raw = readFileSync(path, "utf8");
  } catch {
    return { title: null, cwd: null, cwdName: null, developerMsgs: 0, assistantMsgs: 0, firstUserPreview: null };
  }

  let title: string | null = null;
  let cwd: string | null = null;
  let developerMsgs = 0;
  let assistantMsgs = 0;
  let firstUserPreview: string | null = null;

  for (const line of raw.split("\n")) {
    if (!line.trim()) continue;
    let o: Record<string, unknown>;
    try {
      o = JSON.parse(line);
    } catch {
      continue;
    }
    if (!title && typeof o.aiTitle === "string") title = o.aiTitle;
    if (!cwd && typeof o.cwd === "string") cwd = o.cwd;

    if (o.type === "user" && o.message) {
      developerMsgs++;
      if (!firstUserPreview) {
        const t = textOf((o.message as { content: unknown }).content).trim();
        if (t && !WRAPPER.some((w) => t.startsWith(w))) {
          firstUserPreview = t.length > 100 ? t.slice(0, 100) + "…" : t;
        }
      }
    } else if (o.type === "assistant") {
      assistantMsgs++;
    }
  }

  return {
    title,
    cwd,
    cwdName: cwd ? basename(cwd) : null,
    developerMsgs,
    assistantMsgs,
    firstUserPreview,
  };
}
