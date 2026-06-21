import { readFileSync } from "node:fs";
import type { LogMessage, ParsedLog, Speaker } from "./types.ts";

// Parse one Claude Code .jsonl log into normalized messages.
//
// File shape (verified against real logs): one JSON object per line, each with a
// `type`. Only `user` and `assistant` lines are conversation. message.content is
// either a plain string (user) or an array of typed blocks (assistant / rich user).
// We keep ONLY `text` blocks — thinking / tool_use / tool_result are excluded.

interface RawLine {
  type?: string;
  timestamp?: string;
  sessionId?: string;
  message?: {
    role?: string;
    content?: unknown;
  };
}

/** Pull human-readable text out of a message.content (string or block array). */
function extractText(content: unknown): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .filter(
      (b): b is { type: string; text: string } =>
        !!b &&
        typeof b === "object" &&
        (b as { type?: string }).type === "text" &&
        typeof (b as { text?: unknown }).text === "string"
    )
    .map((b) => b.text)
    .join("\n");
}

export function parseLog(filePath: string): ParsedLog {
  const raw = readFileSync(filePath, "utf8");
  const messages: LogMessage[] = [];
  let sessionId: string | null = null;

  for (const line of raw.split("\n")) {
    if (!line.trim()) continue;

    let obj: RawLine;
    try {
      obj = JSON.parse(line);
    } catch {
      continue; // skip malformed lines rather than failing the whole parse
    }

    if (obj.sessionId && !sessionId) sessionId = obj.sessionId;
    if (obj.type !== "user" && obj.type !== "assistant") continue;

    const text = extractText(obj.message?.content).trim();
    if (!text) continue; // pure tool-call / thinking turns carry no speech

    const speaker: Speaker = obj.type === "user" ? "developer" : "assistant";
    messages.push({ speaker, text, timestamp: obj.timestamp ?? null });
  }

  return { sessionId, messages };
}
