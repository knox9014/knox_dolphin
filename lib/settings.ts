import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

// Manage the Anthropic API key in the local .env file. Server-only. The key is
// read live (env var first, then .env) so saving via the UI takes effect without
// a restart. The full key is never returned to the client — only a masked form.

const ENV_PATH = resolve(".env");
const KEY = "ANTHROPIC_API_KEY";

function parseEnv(): Record<string, string> {
  if (!existsSync(ENV_PATH)) return {};
  const out: Record<string, string> = {};
  for (const line of readFileSync(ENV_PATH, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    out[t.slice(0, eq).trim()] = t.slice(eq + 1).trim();
  }
  return out;
}

/** Live key: process env first, then the .env file. */
export function getAnthropicKey(): string | undefined {
  const fromEnv = process.env[KEY];
  if (fromEnv && fromEnv.trim()) return fromEnv.trim();
  const fromFile = parseEnv()[KEY];
  return fromFile && fromFile.trim() ? fromFile.trim() : undefined;
}

export function keyStatus(): { configured: boolean; masked: string | null } {
  const k = getAnthropicKey();
  if (!k) return { configured: false, masked: null };
  const tail = k.slice(-4);
  return { configured: true, masked: `sk-ant-…${tail}` };
}

/** Write/replace ANTHROPIC_API_KEY in .env, preserving other lines. */
export function setAnthropicKey(key: string): void {
  const trimmed = key.trim();
  const lines = existsSync(ENV_PATH) ? readFileSync(ENV_PATH, "utf8").split("\n") : [];
  let replaced = false;
  const next = lines.map((line) => {
    if (line.trim().startsWith(`${KEY}=`)) {
      replaced = true;
      return `${KEY}=${trimmed}`;
    }
    return line;
  });
  if (!replaced) next.push(`${KEY}=${trimmed}`);
  writeFileSync(ENV_PATH, next.join("\n").replace(/\n+$/, "\n"), "utf8");
  // also update the running process so the very next request sees it
  process.env[KEY] = trimmed;
}

export function clearAnthropicKey(): void {
  process.env[KEY] = "";
  if (!existsSync(ENV_PATH)) return;
  const next = readFileSync(ENV_PATH, "utf8")
    .split("\n")
    .map((line) => (line.trim().startsWith(`${KEY}=`) ? `${KEY}=` : line));
  writeFileSync(ENV_PATH, next.join("\n"), "utf8");
}
