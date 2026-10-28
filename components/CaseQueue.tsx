"use client";

import { Fragment, useMemo, useState } from "react";
import rules from "@/data/scoring_rules.json";
import CaseReportButton from "@/components/CaseReportButton";
import { LikelihoodBadge, TierBadge, VerdictBadge, TIER_STYLE, VERDICT_STYLE } from "@/components/Visuals";
import { deriveCaseFactors, firedFactors } from "@/lib/caseFactors";
import { DOMAIN_LABELS } from "@/lib/labels";
import { VERDICT_CASCADE } from "@/lib/rules";
import { VerdictCase } from "@/lib/types";

type SortKey =
  | "case_id"
  | "parent_asin"
  | "rating"
  | "score"
  | "priority"
  | "likelihood"
  | "verdict"
  | "domain";

const TIER_ORDER: Record<string, number> = {
  "Routine review": 0,
  "Contextual examination": 1,
  "High-priority examination": 2
};

const LIKELIHOOD_ORDER: Record<string, number> = { Weak: 0, Moderate: 1, Strong: 2, "Very strong": 3 };

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "case_id", label: "Case" },
  { key: "parent_asin", label: "ASIN" },
  { key: "rating", label: "★" },
  { key: "score", label: "Score" },
  { key: "priority", label: "Priority" },
  { key: "likelihood", label: "Likelihood" },
  { key: "verdict", label: "Verdict" },
  { key: "domain", label: "Domain" }
];

function sortValue(c: VerdictCase, key: SortKey): number | string {
  switch (key) {
    case "rating":
      return c.rating;
    case "score":
      return c.forensic_signal_score;
    case "priority":
      return TIER_ORDER[c.investigation_priority] ?? 0;
    case "likelihood":
      return LIKELIHOOD_ORDER[c.cooccurrence_likelihood] ?? 0;
    case "verdict":
      return c.forensic_verdict;
    case "domain":
      return DOMAIN_LABELS[c.dominant_signal_domain] || c.dominant_signal_domain;
    case "parent_asin":
      return c.parent_asin;
    default:
      return c.case_id;
  }
}

function countBy(cases: VerdictCase[], pick: (c: VerdictCase) => string): Record<string, number> {
  return cases.reduce<Record<string, number>>((acc, c) => {
    const key = pick(c);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

export default function CaseQueue({ cases }: { cases: VerdictCase[] }) {
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "score", dir: "desc" });
  const [openId, setOpenId] = useState<string | null>(null);

  const sorted = useMemo(() => {
    const list = [...cases];
    list.sort((a, b) => {
      const va = sortValue(a, sort.key);
      const vb = sortValue(b, sort.key);
      const r =
        typeof va === "number" && typeof vb === "number"
          ? va - vb
          : String(va).localeCompare(String(vb));
      if (r !== 0) return sort.dir === "asc" ? r : -r;
      return b.forensic_signal_score - a.forensic_signal_score;
    });
    return list;
  }, [cases, sort]);

  const tierCounts = countBy(cases, (c) => c.investigation_priority);
  const verdictCounts = countBy(cases, (c) => c.forensic_verdict);

  const openCase = openId ? cases.find((c) => c.case_id === openId) ?? null : null;
  const openFactors = useMemo(
    () =>
      openCase
        ? deriveCaseFactors(
            openCase,
            rules.component_weights as Record<string, number>,
            rules.domains as Record<string, string[]>
          )
        : [],
    [openCase]
  );

  function toggleSort(key: SortKey) {
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: key === "case_id" || key === "parent_asin" || key === "verdict" || key === "domain" ? "asc" : "desc" }
    );
  }

  return (
    <div className="space-y-6">
      <div className="card animate-fade-up p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-ink-faint">Total</span>
          <span className="pill bg-ink text-canvas">{cases.length} cases</span>
          <span className="ml-1 text-[10px] font-bold uppercase tracking-wider text-ink-faint">
            Priority
          </span>
          {Object.keys(TIER_ORDER).map((tier) => (
            <span key={tier} className={`pill ${TIER_STYLE[tier].bg}`}>
              <span className={`h-2 w-2 rounded-full ${TIER_STYLE[tier].dot}`} />
              {tier} · {tierCounts[tier] ?? 0}
            </span>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-ink-faint">
            Verdicts
          </span>
          {VERDICT_CASCADE.filter((rule) => verdictCounts[rule.verdict]).map((rule) => {
            const style = VERDICT_STYLE[rule.verdict] || VERDICT_STYLE["Routine complaint"];
            return (
              <span key={rule.verdict} className={`pill ${style.bg}`}>
                <span className={`h-2 w-2 rounded-full ${style.dot}`} />
                {rule.verdict} · {verdictCounts[rule.verdict]}
              </span>
            );
          })}
        </div>
      </div>

      <div className="card animate-fade-up p-6 sm:p-8">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[940px] text-left">
            <thead>
              <tr className="border-b border-line text-[10px] font-bold uppercase tracking-wider text-ink-faint">
                {COLUMNS.map((col) => (
                  <th key={col.key} className="py-2.5 pr-3">
                    <button
                      type="button"
                      onClick={() => toggleSort(col.key)}
                      className={`inline-flex items-center gap-1 uppercase tracking-wider transition hover:text-ink ${
                        sort.key === col.key ? "text-ink" : ""
                      }`}
                    >
                      {col.label}
                      <span className="text-[9px]">
                        {sort.key === col.key ? (sort.dir === "asc" ? "▲" : "▼") : "↕"}
                      </span>
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((c) => {
                const open = openId === c.case_id;
                return (
                  <Fragment key={c.case_id}>
                    <tr
                      onClick={() => setOpenId(open ? null : c.case_id)}
                      className={`cursor-pointer border-b border-line/60 transition hover:bg-canvas ${
                        open ? "bg-canvas" : ""
                      }`}
                    >
                      <td className="py-3 pr-3 font-mono text-xs font-semibold">
                        {c.case_id.replace("CASE-", "#")}
                      </td>
                      <td className="py-3 pr-3 font-mono text-xs">{c.parent_asin}</td>
                      <td className="py-3 pr-3 text-xs font-semibold">{c.rating}★</td>
                      <td className="py-3 pr-3 text-xs font-bold">{c.forensic_signal_score}</td>
                      <td className="py-3 pr-3">
                        <TierBadge tier={c.investigation_priority} />
                      </td>
                      <td className="py-3 pr-3">
                        <LikelihoodBadge
                          band={c.cooccurrence_likelihood}
                          confidence={c.likelihood_confidence_pct}
                        />
                      </td>
                      <td className="py-3 pr-3">
                        <VerdictBadge verdict={c.forensic_verdict} />
                      </td>
                      <td className="py-3 pr-3 text-xs font-semibold">
                        {DOMAIN_LABELS[c.dominant_signal_domain]}
                      </td>
                    </tr>
                    {open && (
                      <tr className="border-b border-line/60 bg-canvas/70">
                        <td colSpan={COLUMNS.length} className="p-0">
                          <div className="grid gap-5 px-1 py-5 lg:grid-cols-[1.5fr_1fr]">
                            <div>
                              <div className="flex items-baseline justify-between gap-3">
                                <h3 className="text-sm font-bold tracking-tight">Fired factors</h3>
                                <span className="text-[11px] font-semibold text-ink-faint">
                                  {firedFactors(openFactors).length} factors ·{" "}
                                  {c.forensic_signal_score} points
                                </span>
                              </div>
                              <div className="mt-3 overflow-x-auto">
                                <table className="w-full min-w-[460px] text-left">
                                  <thead>
                                    <tr className="border-b border-line text-[10px] font-bold uppercase tracking-wider text-ink-faint">
                                      <th className="py-2 pr-3">Factor</th>
                                      <th className="py-2 pr-3">Domain</th>
                                      <th className="py-2 pr-3 text-right">Points</th>
                                      <th className="py-2">Interpretation</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {firedFactors(openFactors).map((f) => (
                                      <tr key={f.key} className="border-b border-line/50">
                                        <td className="py-2 pr-3 text-xs font-semibold">{f.label}</td>
                                        <td className="py-2 pr-3 text-xs">
                                          {f.domain ? DOMAIN_LABELS[f.domain] : "—"}
                                        </td>
                                        <td className="py-2 pr-3 text-right text-xs font-bold">
                                          {f.points}/{f.max_points}
                                        </td>
                                        <td className="py-2 text-xs muted">{f.interpretation}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                                {firedFactors(openFactors).length === 0 && (
                                  <p className="mt-2 text-xs muted">
                                    No factor points allocated for this case.
                                  </p>
                                )}
                                {!openCase?.factors?.length && (
                                  <p className="mt-2 text-[11px] leading-snug text-ink-faint">
                                    This export stores each case&apos;s score and dominant domain
                                    rather than per-case flags, so factor rows are derived by
                                    allocating the score across scoring_rules.json weights with the
                                    dominant domain prioritized.
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col gap-3">
                              <div className="grid grid-cols-2 gap-3">
                                {[
                                  ["Review ID", String(c.review_id)],
                                  ["Surprise p-value", c.cooccurrence_surprise_p.toFixed(4)],
                                  ["Confidence", `${c.likelihood_confidence_pct}%`],
                                  ["Reviewer ID", c.user_id]
                                ].map(([label, value]) => (
                                  <div
                                    key={label}
                                    className="rounded-2xl border border-line bg-white px-3.5 py-2.5"
                                  >
                                    <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
                                      {label}
                                    </div>
                                    <div className="mt-0.5 break-all text-xs font-bold leading-tight">
                                      {value}
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <div className="rounded-2xl border border-line bg-white px-4 py-3">
                                <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
                                  Customer guidance
                                </div>
                                <p className="mt-1 text-xs leading-relaxed muted">
                                  {c.customer_guidance}
                                </p>
                              </div>
                              <div className="rounded-2xl border border-line bg-white px-4 py-3">
                                <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
                                  Investigative conclusion
                                </div>
                                <p className="mt-1 text-xs leading-relaxed muted">
                                  {c.investigative_conclusion}
                                </p>
                              </div>
                              <CaseReportButton
                                caseData={c}
                                factors={openFactors}
                                className="btn-ghost self-start !py-2 !px-4 !text-xs"
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs leading-relaxed muted">
          Select a column header to re-sort (default: score, highest first). Click a row to expand
          its detail.
        </p>
      </div>
    </div>
  );
}
