import { AnalyzeResponse, VerdictCase } from "./types";
import { DerivedFactor, firedFactors } from "./caseFactors";

export function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function line(char = "-"): string {
  return char.repeat(64);
}

function row(label: string, value: string): string {
  return `${(label + " ").padEnd(20, ".")} ${value}`;
}

const DATASET_CONTEXT =
  "Sample case from data/verdict_sample.json (notebook full run over 60,000 one- and " +
  "two-star Amazon Electronics reviews, McAuley-Lab Amazon Reviews 2023).";

export function buildCaseReport(c: VerdictCase, factors: DerivedFactor[]): string {
  const fired = firedFactors(factors);
  const total = factors.reduce((acc, f) => acc + f.points, 0);
  const parts: string[] = [];

  parts.push(line("="));
  parts.push("FORENSIC CASE REPORT");
  parts.push(line("="));
  parts.push(row("Case ID", c.case_id));
  parts.push(row("Report date", new Date().toLocaleString()));
  parts.push("");
  parts.push(row("Dataset", DATASET_CONTEXT));
  parts.push(row("Review ID", String(c.review_id)));
  parts.push(row("Reviewer ID", c.user_id));
  parts.push(row("ASIN", c.parent_asin));
  parts.push(row("Rating", `${c.rating} of 5`));
  parts.push("");
  parts.push(line());
  parts.push(row("Score", `${c.forensic_signal_score} points`));
  parts.push(row("Priority", c.investigation_priority));
  parts.push(row("Likelihood", `${c.cooccurrence_likelihood} (${c.likelihood_confidence_pct}% confidence)`));
  parts.push(row("Surprise p-value", c.cooccurrence_surprise_p.toFixed(4)));
  parts.push(row("Dominant domain", c.dominant_signal_domain));
  parts.push("");
  parts.push(line());
  parts.push(row("Verdict", c.forensic_verdict));
  parts.push(`Customer guidance: ${c.customer_guidance}`);
  parts.push("");
  parts.push(line());
  parts.push("FIRED FACTORS (score allocation from scoring_rules.json weights)");
  parts.push(`${"FACTOR".padEnd(26)} ${"PTS".padStart(4)} ${"MAX".padStart(4)}  DOMAIN`);
  if (fired.length === 0) {
    parts.push("(no factors allocated — score is 0)");
  } else {
    for (const f of fired) {
      parts.push(`${f.label.padEnd(26)} ${String(f.points).padStart(4)} ${String(f.max_points).padStart(4)}  ${f.domain || "—"}`);
    }
    parts.push(`${"TOTAL".padEnd(26)} ${String(total).padStart(4)} ${String(factors.reduce((a, f) => a + f.max_points, 0)).padStart(4)}`);
    parts.push("");
    for (const f of fired) parts.push(`  · ${f.interpretation}`);
  }
  parts.push("");
  parts.push(line());
  parts.push("RECOMMENDED INTERPRETATION");
  parts.push(c.investigative_conclusion);
  parts.push(line("="));
  parts.push("A high score prioritizes a case for review; it does not prove fraud.");
  parts.push("");

  return parts.join("\n");
}

export function buildAnalysisReport(result: AnalyzeResponse, excerpt?: string | null): string {
  const parts: string[] = [];

  parts.push(line("="));
  parts.push("FORENSIC ANALYSIS REPORT");
  parts.push(line("="));
  parts.push(row("Case ID", result.case_id));
  parts.push(row("Report date", new Date().toLocaleString()));
  parts.push("");
  parts.push(row("Review excerpt", (excerpt || "").trim().slice(0, 400) || "not stored for this case"));
  parts.push("");
  parts.push(line());
  parts.push(row("Score", `${result.forensic_signal_score} of ${result.max_points} points`));
  parts.push(row("Assessable points", `${result.assessable_points} (${result.assessable_components} of ${result.total_components} components)`));
  parts.push(row("Priority", result.investigation_priority));
  parts.push(row("Likelihood", `${result.cooccurrence_likelihood} (${result.likelihood_confidence_pct}% confidence)`));
  parts.push(row("Surprise p-value", result.cooccurrence_surprise_p.toFixed(4)));
  parts.push(row("Null expected score", result.null_expected_score.toFixed(2)));
  parts.push(row("Dominant domain", result.dominant_signal_domain));
  parts.push("");
  parts.push(line());
  parts.push(row("Verdict", result.forensic_verdict));
  parts.push("Why this verdict:");
  for (const reason of result.why_this_verdict) parts.push(`  · ${reason}`);
  parts.push("");
  parts.push(line());
  parts.push("PER-COMPONENT BREAKDOWN");
  parts.push(`${"COMPONENT".padEnd(24)} ${"PTS".padStart(7)}  OBSERVED / INTERPRETATION`);
  for (const c of result.components) {
    parts.push(
      `${c.label.padEnd(24)} ${`${c.points}/${c.max_points}`.padStart(7)}  ${c.observed} — ${c.interpretation}`
    );
  }
  parts.push("");
  parts.push(line());
  parts.push("RECOMMENDED ACTIONS");
  for (const action of result.recommended_actions) parts.push(`  · ${action}`);
  parts.push("");
  parts.push(line());
  parts.push("ALTERNATIVE EXPLANATIONS");
  for (const alt of result.alternative_explanations) parts.push(`  · ${alt}`);
  parts.push("");
  parts.push(line());
  parts.push("INVESTIGATIVE CONCLUSION");
  parts.push(result.investigative_conclusion);
  parts.push(line("="));
  parts.push("A high score prioritizes a case for review; it does not prove fraud.");
  parts.push("");

  return parts.join("\n");
}
