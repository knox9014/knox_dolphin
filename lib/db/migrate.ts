import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { getDb } from "./connection.ts";

// Apply schema.sql. Idempotent: every statement is CREATE ... IF NOT EXISTS,
// so running this repeatedly is safe. Kept dumb on purpose for the MVP — a real
// versioned migration system is overkill until the schema actually changes.

export function migrate(): string[] {
  const here = dirname(fileURLToPath(import.meta.url));
  const sql = readFileSync(join(here, "schema.sql"), "utf8");
  const db = getDb();
  db.exec(sql);

  const tables = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    .all() as { name: string }[];
  return tables.map((t) => t.name);
}
