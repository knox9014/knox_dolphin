import { NextResponse } from "next/server";
import { recall } from "@/core/recall/recall";
import { keywordRetriever } from "@/core/recall/keyword-retriever";
import { mockAnswerer } from "@/core/recall/mock-answerer";
import { ensureDefaultProject } from "@/lib/db/read-repo";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { question } = (await req.json()) as { question?: string };
  if (!question?.trim()) {
    return NextResponse.json({ error: "question required" }, { status: 400 });
  }

  const projectId = ensureDefaultProject();
  const res = await recall(projectId, question, keywordRetriever, mockAnswerer);
  return NextResponse.json({
    answer: res.answer,
    grounded: res.grounded,
    records: res.records.map((r) => ({ id: r.id, decision: r.decision, source_quote: r.source_quote })),
  });
}
