import { NextResponse } from "next/server";
import { listProjects, createProject, ensureDefaultProject } from "@/lib/db/read-repo";
import { getActiveProjectId, PROJECT_COOKIE } from "@/lib/active-project";

export const runtime = "nodejs";

// List projects + which one is active.
export async function GET() {
  ensureDefaultProject(); // guarantee at least one
  const projects = listProjects();
  const activeId = await getActiveProjectId();
  return NextResponse.json({ projects, activeId });
}

// Create a project and switch to it (sets the active cookie).
export async function POST(req: Request) {
  const { name } = (await req.json()) as { name?: string };
  if (!name?.trim()) {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }
  const id = createProject(name);
  const res = NextResponse.json({ ok: true, id });
  res.cookies.set(PROJECT_COOKIE, String(id), { path: "/", maxAge: 60 * 60 * 24 * 365 });
  return res;
}
