import { NextResponse } from "next/server";
import { keyStatus, setAnthropicKey, clearAnthropicKey } from "@/lib/settings";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(keyStatus());
}

export async function POST(req: Request) {
  const { apiKey } = (await req.json()) as { apiKey?: string };
  if (typeof apiKey !== "string" || !apiKey.trim()) {
    return NextResponse.json({ error: "apiKey required" }, { status: 400 });
  }
  // light sanity check; not a guarantee of validity
  if (!apiKey.trim().startsWith("sk-ant-")) {
    return NextResponse.json({ error: "Anthropic 키는 sk-ant- 로 시작합니다" }, { status: 400 });
  }
  setAnthropicKey(apiKey);
  return NextResponse.json(keyStatus());
}

export async function DELETE() {
  clearAnthropicKey();
  return NextResponse.json(keyStatus());
}
