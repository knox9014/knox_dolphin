import { getDb } from "../../lib/db/connection.ts";

// Mark one confirmed decision as superseded by another. We never delete the old
// record (invariant #6) — losing "why it changed" defeats the whole product.
// This lives alongside confirmation because it mutates `decisions`.

interface DecisionRow {
  id: number;
  project_id: number;
  status: string;
}

function load(id: number): DecisionRow {
  const row = getDb()
    .prepare("SELECT id, project_id, status FROM decisions WHERE id = ?")
    .get(id) as DecisionRow | undefined;
  if (!row) throw new Error(`decision ${id} not found`);
  return row;
}

/** Mark `oldId` as superseded by `newId`. Both must be confirmed and in the same project. */
export function supersede(oldId: number, newId: number): void {
  if (oldId === newId) throw new Error("a decision cannot supersede itself");

  const oldD = load(oldId);
  const newD = load(newId);

  if (oldD.project_id !== newD.project_id) throw new Error("decisions belong to different projects");
  if (oldD.status === "superseded") throw new Error(`decision ${oldId} is already superseded`);
  if (newD.status === "superseded") throw new Error(`replacement ${newId} is itself superseded`);

  getDb()
    .prepare("UPDATE decisions SET status = 'superseded', superseded_by = ? WHERE id = ?")
    .run(newId, oldId);
}
