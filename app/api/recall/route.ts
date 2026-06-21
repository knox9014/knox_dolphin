import { NextResponse } from "next/server";
import { recall } from "@/core/recall/recall";
import { keywordRetriever } from "@/core/recall/keyword-retriever";
import { mockAnswerer } from "@/core/recall/mock-answerer";
import { anthropicAnswerer } from "@/core/recall/anthropic-answerer";
import { getActiveProjectId } from "@/lib/active-project";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { question } = (await req.json()) as { question?: string };
  if (!question?.trim()) {
    return NextResponse.json({ error: "question required" }, { status: 400 });
  }

  // Real LLM if a key is configured; otherwise fall back to the mock so the app
  // still works key-free. The key is read server-side only, never sent to the browser.
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const answerer = apiKey ? anthropicAnswerer(apiKey) : mockAnswerer;

  const projectId = await getActiveProjectId();
  const res = await recall(projectId, question, keywordRetriever, answerer);
  return NextResponse.json({
    answer: res.answer,
    grounded: res.grounded,
    usedModel: res.grounded ? Boolean(apiKey) : false,
    records: res.records.map((r) => ({
      id: r.id,
      decision: r.decision,
      source_quote: r.source_quote,
      status: r.status,
      superseded_by: r.superseded_by,
    })),
  });
}
