import { NextRequest, NextResponse } from "next/server";
import { analyze } from "@/lib/scoring";
import { AnalyzeRequest } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: AnalyzeRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 }
    );
  }

  if (!body.review_text || typeof body.review_text !== "string" || body.review_text.trim().length < 10) {
    return NextResponse.json(
      { error: "Provide at least a short review description (10+ characters)." },
      { status: 400 }
    );
  }

  const pythonUrl = process.env.PYTHON_INFERENCE_URL;
  if (pythonUrl) {
    try {
      const res = await fetch(`${pythonUrl.replace(/\/$/, "")}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(6000)
      });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch {
      // fall through to TypeScript engine
    }
  }

  try {
    const result = analyze(body);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Scoring engine failed. Check input values." },
      { status: 500 }
    );
  }
}
