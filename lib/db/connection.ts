import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { homedir } from "node:os";

// Single SQLite file = the entire local memory store (local-first, see DECISIONS D6/D7).
// One connection is reused across the process (singleton) to avoid file-lock churn.
//
// Default lives in the user's home (~/.knox-dolphin/knox.db) so the web app and the
// MCP server/plugin — which run from different working directories — share one store.
// Override with KNOX_DB_PATH.

const DB_PATH = resolve(process.env.KNOX_DB_PATH ?? join(homedir(), ".knox-dolphin", "knox.db"));

let db: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (db) return db;

  // Ensure the parent folder exists before SQLite tries to create the file.
  mkdirSync(dirname(DB_PATH), { recursive: true });

  db = new DatabaseSync(DB_PATH);
  // WAL: safer concurrent reads while a write is in flight. Cheap, no downside locally.
  db.exec("PRAGMA journal_mode = WAL;");
  // Enforce REFERENCES (project_id, superseded_by) — off by default in SQLite.
  db.exec("PRAGMA foreign_keys = ON;");
  return db;
}

export function getDbPath(): string {
  return DB_PATH;
}
