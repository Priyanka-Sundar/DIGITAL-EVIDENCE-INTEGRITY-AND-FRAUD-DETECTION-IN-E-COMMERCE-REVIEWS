import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-static";

export async function GET() {
  const file = path.join(process.cwd(), "data", "dashboard_data.json");
  try {
    const raw = fs.readFileSync(file, "utf-8");
    return new NextResponse(raw, {
      headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=300" }
    });
  } catch {
    return NextResponse.json({ error: "dashboard_data.json not found." }, { status: 404 });
  }
}
