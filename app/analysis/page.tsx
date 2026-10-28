"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnalyzeRequest, AnalyzeResponse } from "@/lib/types";
import { loadResult, loadHistory } from "@/lib/store";
import { buildAnalysisReport, downloadText } from "@/lib/report";
import {
  DOMAIN_COLOR,
  DOMAIN_LABELS_LOCAL,
  LikelihoodBadge,
  ScoreGauge,
  TierBadge,
  VerdictBadge
} from "@/components/Visuals";

export default function AnalysisPage() {
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [request, setRequest] = useState<AnalyzeRequest | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "empty">("loading");
  const [history, setHistory] = useState<Awaited<ReturnType<typeof loadHistory>>>([]);

  useEffect(() => {
    const stored = loadHistory();
    const r = loadResult();
    if (r) {
      setResult(r);
      setRequest(stored.find((item) => item.result.case_id === r.case_id)?.request ?? null);
      setStatus("ready");
    } else {
      setStatus("empty");
    }
    setHistory(stored.slice(0, 6));
  }, []);

  if (status === "loading") {
    return (
      <div className="mx-auto max-w-5xl px-5 py-14">
        <div className="mb-8 h-8 w-56 rounded-2xl skeleton" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 rounded-3xl skeleton" />
          ))}
        </div>
        <div className="mt-6 h-72 rounded-3xl skeleton" />
        <div className="mt-6 h-64 rounded-3xl skeleton" />
        <p className="mt-6 text-center text-sm muted">Loading saved analysis…</p>
      </div>
    );
  }

  if (status === "empty" || !result) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-20 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-line">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#8A8177" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M14 2v6h6" />
          </svg>
        </div>
        <h1 className="mt-6 text-2xl font-bold tracking-tight">No analysis yet</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed muted">
          Run a forensic analysis from the input page and the verdict, sub-signal
          breakdown, and plain-language reasons will appear here.
        </p>
        <Link href="/" className="btn-primary mt-8">
          Start an analysis
        </Link>

        {history.length > 0 && (
          <div className="mx-auto mt-14 max-w-md text-left">
            <h2 className="text-sm font-bold tracking-tight">Recent cases on this device</h2>
            <div className="mt-3 space-y-2">
              {history.map((item) => (
                <button
                  key={item.result.case_id}
                  onClick={() => {
                    setResult(item.result);
                    setRequest(item.request);
                    setStatus("ready");
                  }}
                  className="flex w-full items-center justify-between gap-3 rounded-2xl border border-line bg-white px-4 py-3 text-left transition hover:border-ink/30"
                >
                  <span className="truncate text-xs font-semibold">{item.request.review_text.slice(0, 44)}…</span>
                  <span className="shrink-0 text-xs font-bold">{item.result.forensic_signal_score} pts</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return <ResultView result={result} request={request} />;
}

function ResultView({ result, request }: { result: AnalyzeResponse; request: AnalyzeRequest | null }) {
  const fired = result.components.filter((c) => c.fired);
  const maxPoints = Math.max(...result.components.map((c) => c.points), 1);

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:py-14">
      <div className="animate-fade-up flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-faint">
            Case {result.case_id}
          </span>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight">Forensic verdict</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={!result}
            className="btn-ghost"
            onClick={() =>
              downloadText(
                `case_report_${result.case_id}.txt`,
                buildAnalysisReport(result, request?.review_text)
              )
            }
          >
            Download case report
          </button>
          <Link href="/" className="btn-ghost">
            New analysis
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <div className="card animate-fade-up p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <VerdictBadge verdict={result.forensic_verdict} large />
              <p className="mt-4 max-w-md text-sm leading-relaxed muted">{result.customer_guidance}</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold tracking-tight">{result.forensic_signal_score}</div>
              <div className="text-xs font-semibold text-ink-faint">
                of {result.max_points} points
              </div>
              <div className="mt-2">
                <TierBadge tier={result.investigation_priority} />
              </div>
            </div>
          </div>

          <div className="mt-6">
            <ScoreGauge
              score={result.forensic_signal_score}
              max={result.max_points}
              tier={result.investigation_priority}
            />
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Meta label="Likelihood" value={result.cooccurrence_likelihood} />
            <Meta label="Surprise p-value" value={result.cooccurrence_surprise_p.toFixed(4)} />
            <Meta label="Dominant domain" value={DOMAIN_LABELS_LOCAL[result.dominant_signal_domain]} />
            <Meta label="Signals fired" value={`${result.why_this_verdict.length} of ${result.total_components}`} />
            <Meta label="Null expected score" value={result.null_expected_score.toFixed(2)} />
          </div>
        </div>

        <div className="card animate-fade-up p-6 sm:p-8">
          <h2 className="text-sm font-bold tracking-tight">Why this verdict</h2>
          {fired.length === 0 ? (
            <p className="mt-4 text-sm leading-relaxed muted">
              No forensic signal components fired. The review falls in the routine range
              and carries no elevated manipulation indicators.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {result.why_this_verdict.map((reason, i) => (
                <li key={i} className="flex gap-3 text-sm leading-relaxed">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-ink" />
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-6 border-t border-line pt-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-faint">
              Recommended actions
            </h3>
            <ul className="mt-3 space-y-2">
              {result.recommended_actions.map((action, i) => (
                <li key={i} className="text-sm leading-relaxed muted">· {action}</li>
              ))}
            </ul>
          </div>

          <div className="mt-5 border-t border-line pt-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-faint">
              Alternative explanations
            </h3>
            <ul className="mt-3 space-y-2">
              {result.alternative_explanations.map((alt, i) => (
                <li key={i} className="text-sm leading-relaxed muted">· {alt}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="card animate-fade-up mt-6 p-6 sm:p-8">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-lg font-bold tracking-tight">Sub-signal breakdown</h2>
          <span className="text-xs font-semibold text-ink-faint">
            {result.assessable_components} assessable of {result.total_components} total
          </span>
        </div>
        <div className="mt-6 space-y-4">
          {result.components.map((component) => (
            <div key={component.key} className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between gap-3">
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: DOMAIN_COLOR[component.domain || "evidence_integrity"] }}
                  />
                  {component.label}
                  {!component.assessable && (
                    <span className="pill bg-line !py-0.5 !px-2 !text-[10px]">notebook only</span>
                  )}
                </span>
                <span className="text-xs font-bold">
                  {component.points}/{component.max_points}
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-line">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${(component.points / maxPoints) * 100}%`,
                    backgroundColor: component.fired
                      ? DOMAIN_COLOR[component.domain || "evidence_integrity"]
                      : "transparent"
                  }}
                />
              </div>
              <p className="text-xs leading-relaxed muted">
                {component.observed} — {component.interpretation}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="card animate-fade-up mt-6 p-6 sm:p-8">
        <h2 className="text-lg font-bold tracking-tight">Score interpretation</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {[
            ["0 – 5", "Routine review", "Signals are sparse. Judge the review on its content.", "bg-sky/25"],
            ["6 – 9", "Contextual examination", "Several signals accumulated. Read alongside other reviews.", "bg-butter/35"],
            ["10+", "High-priority examination", "Dense signal cluster. Cross-check before trusting the case.", "bg-coral/30"]
          ].map(([range, tier, desc, bg]) => {
            const active =
              (range === "0 – 5" && result.forensic_signal_score <= 5) ||
              (range === "6 – 9" && result.forensic_signal_score >= 6 && result.forensic_signal_score <= 9) ||
              (range === "10+" && result.forensic_signal_score >= 10);
            return (
              <div
                key={range}
                className={`rounded-2xl border p-4 transition ${
                  active ? "border-ink/25 bg-white shadow-card" : "border-line bg-white/50 opacity-70"
                }`}
              >
                <span className={`pill ${bg}`}>{range}</span>
                <h3 className="mt-3 text-sm font-bold">{tier}</h3>
                <p className="mt-1.5 text-xs leading-relaxed muted">{desc}</p>
                {active && (
                  <span className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-bold">
                    <span className="h-1.5 w-1.5 rounded-full bg-ink" />
                    This case
                  </span>
                )}
              </div>
            );
          })}
        </div>
        <p className="mt-5 border-t border-line pt-4 text-sm leading-relaxed muted">
          {result.investigative_conclusion}
        </p>
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-canvas px-3.5 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
        {label}
      </div>
      <div className="mt-0.5 text-sm font-bold leading-tight">{value}</div>
    </div>
  );
}
