import { getDb } from "./connection";

// Scaffolding-only health check: prove we can open the SQLite file and run a query.
// Real schema (projects / candidates / decisions) is build order #2, not here.

export function ping(): { ok: boolean; result: number } {
  const row = getDb().prepare("SELECT 1 AS one").get() as { one: number };
  return { ok: row.one === 1, result: row.one };
}
