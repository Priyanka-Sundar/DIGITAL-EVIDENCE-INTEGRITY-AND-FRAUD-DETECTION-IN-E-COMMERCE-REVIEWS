import fs from "fs";
import path from "path";
import CaseQueue from "@/components/CaseQueue";
import { VerdictCase } from "@/lib/types";

function loadCases(): VerdictCase[] {
  const file = path.join(process.cwd(), "data", "verdict_sample.json");
  try {
    const raw = fs.readFileSync(file, "utf-8");
    return JSON.parse(raw) as VerdictCase[];
  } catch {
    return [];
  }
}

export default function CasesPage() {
  const cases = loadCases();

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:py-14">
      <div className="animate-fade-up mb-8 max-w-2xl">
        <span className="pill bg-coral/40 mb-4">
          <span className="h-2 w-2 rounded-full bg-coral" />
          Priority queue
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
          Cases worth a second look
        </h1>
        <p className="mt-3 text-sm sm:text-base leading-relaxed muted max-w-xl">
          The notebook&apos;s exported case sample, ranked by forensic signal score. Expand a row
          for the full case detail or download its plain-text report.
        </p>
      </div>

      {cases.length === 0 ? (
        <div className="card p-6 text-sm muted">
          The case sample could not be read from <span className="font-mono">data/verdict_sample.json</span>.
        </div>
      ) : (
        <CaseQueue cases={cases} />
      )}
    </div>
  );
}
