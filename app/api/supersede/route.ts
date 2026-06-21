import { NextResponse } from "next/server";
import { supersede } from "@/core/confirmation/supersede";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { oldId, newId } = (await req.json()) as { oldId?: number; newId?: number };
  if (typeof oldId !== "number" || typeof newId !== "number") {
    return NextResponse.json({ error: "oldId and newId (numbers) required" }, { status: 400 });
  }
  try {
    supersede(oldId, newId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 409 });
  }
}
