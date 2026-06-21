import { cookies } from "next/headers";
import { ensureDefaultProject, projectExists } from "./db/read-repo.ts";

export const PROJECT_COOKIE = "knox_project";

// Resolve the currently-selected project from the cookie. Falls back to the
// default project if the cookie is missing or points at a deleted project.
// Server-only (reads the request cookie store).
export async function getActiveProjectId(): Promise<number> {
  const store = await cookies();
  const raw = store.get(PROJECT_COOKIE)?.value;
  const id = raw ? Number(raw) : NaN;
  if (Number.isInteger(id) && projectExists(id)) return id;
  return ensureDefaultProject();
}
