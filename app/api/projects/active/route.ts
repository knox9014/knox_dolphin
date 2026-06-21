import { NextResponse } from "next/server";
import { projectExists } from "@/lib/db/read-repo";
import { PROJECT_COOKIE } from "@/lib/active-project";

export const runtime = "nodejs";

// Switch the active project (sets the cookie). Validates the project exists.
export async function POST(req: Request) {
  const { id } = (await req.json()) as { id?: number };
  if (typeof id !== "number" || !projectExists(id)) {
    return NextResponse.json({ error: "unknown project" }, { status: 400 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(PROJECT_COOKIE, String(id), { path: "/", maxAge: 60 * 60 * 24 * 365 });
  return res;
}
