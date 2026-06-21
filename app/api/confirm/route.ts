import { NextResponse } from "next/server";
import { confirmCandidate, rejectCandidate } from "@/core/confirmation/confirm";

export const runtime = "nodejs";

// The write endpoint for the review queue. Promotion path goes through
// core/confirmation only — this route never touches `decisions` directly.
export async function POST(req: Request) {
  const { candidateId, action } = (await req.json()) as {
    candidateId?: number;
    action?: "confirm" | "reject";
  };

  if (typeof candidateId !== "number" || (action !== "confirm" && action !== "reject")) {
    return NextResponse.json({ error: "candidateId (number) and action (confirm|reject) required" }, { status: 400 });
  }

  try {
    if (action === "confirm") {
      const { decisionId } = confirmCandidate(candidateId); // no transcript → relies on insert-time guard + NOT NULL
      return NextResponse.json({ ok: true, decisionId });
    }
    rejectCandidate(candidateId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 409 });
  }
}
