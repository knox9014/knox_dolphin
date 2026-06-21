// Normalized view of a Claude Code conversation log.
// Only human-readable speech survives here — thinking, tool_use, and tool_result
// blocks are dropped on purpose (extraction works on stated speech, not internal
// reasoning; see DECISIONS D1/D3 "추출 ≠ 추론").

export type Speaker = "developer" | "assistant";

export interface LogMessage {
  speaker: Speaker;
  text: string; // verbatim — never trimmed of meaning; used for source_quote substring checks
  timestamp: string | null;
}

export interface ParsedLog {
  sessionId: string | null;
  messages: LogMessage[];
}
