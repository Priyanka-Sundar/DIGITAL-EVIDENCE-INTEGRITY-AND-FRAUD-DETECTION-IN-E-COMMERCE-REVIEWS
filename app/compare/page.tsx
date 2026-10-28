"use client";

import { useEffect, useMemo, useState } from "react";
import rules from "@/data/scoring_rules.json";
import {
  DOMAIN_LABELS_LOCAL,
  LikelihoodBadge,
  TierBadge,
  VerdictBadge
} from "@/components/Visuals";
import { deriveCaseFactors, firedFactors } from "@/lib/caseFactors";
import { cascadeRuleFor, VERDICT_CASCADE } from "@/lib/rules";
import { VerdictCase } from "@/lib/types";

const WEIGHTS = rules.component_weights as Record<string, number>;
const DOMAINS = rules.domains as Record<string, string[]>;

export default function ComparePage() {
  const [cases, setCases] = useState<VerdictCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aId, setAId] = useState("");
  const [bId, setBId] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/cases")
      .then(async (res) => {
        if (!res.ok) throw new Error("Case sample unavailable.");
        return (await res.json()) as VerdictCase[];
      })
      .then((json) => {
        if (cancelled) return;
        setCases(json);
        setAId(json[0]?.case_id ?? "");
        setBId(json[1]?.case_id ?? json[0]?.case_id ?? "");
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load cases.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const caseA = cases.find((c) => c.case_id === aId) ?? null;
  const caseB = cases.find((c) => c.case_id === bId) ?? null;

  const factorsA = useMemo(
    () => (caseA ? firedFactors(deriveCaseFactors(caseA, WEIGHTS, DOMAINS)) : []),
    [caseA]
  );
  const factorsB = useMemo(
    () => (caseB ? firedFactors(deriveCaseFactors(caseB, WEIGHTS, DOMAINS)) : []),
    [caseB]
  );

  const header = (
    <div className="animate-fade-up mb-8 max-w-2xl">
      <span className="pill bg-lilac/40 mb-4">
        <span className="h-2 w-2 rounded-full bg-lilac" />
        Bulk compare
      </span>
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
        Two cases, side by side
      </h1>
      <p className="mt-3 text-sm sm:text-base leading-relaxed muted max-w-xl">
        Pick any two cases from the exported sample to compare score, likelihood, verdict and
        the signals behind them.
      </p>
    </div>
  );

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-5 py-10 sm:py-14">
        {header}
        <div className="grid gap-4 lg:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-80 rounded-3xl skeleton" />
          ))}
        </div>
        <p className="mt-6 text-center text-sm muted">Loading case sample…</p>
      </div>
    );
  }

  if (error || !caseA || !caseB) {
    return (
      <div className="mx-auto max-w-6xl px-5 py-10 sm:py-14">
        {header}
        <div className="card p-6 text-center">
          <p className="text-sm leading-relaxed muted">{error || "No cases to compare."}</p>
        </div>
      </div>
    );
  }

  const keysA = new Set(factorsA.map((f) => f.key));
  const keysB = new Set(factorsB.map((f) => f.key));
  const onlyA = factorsA.filter((f) => !keysB.has(f.key));
  const onlyB = factorsB.filter((f) => !keysA.has(f.key));
  const shared = factorsA.filter((f) => keysB.has(f.key));

  const ruleA = cascadeRuleFor(caseA.forensic_verdict);
  const ruleAIndex = cascadeIndexOf(ruleA.ruleKey);
  const ruleB = cascadeRuleFor(caseB.forensic_verdict);
  const ruleBIndex = cascadeIndexOf(ruleB.ruleKey);

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:py-14">
      {header}

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="case-a">
            Case A
          </label>
          <select
            id="case-a"
            className="input"
            value={aId}
            onChange={(e) => setAId(e.target.value)}
          >
            {cases.map((c) => (
              <option key={c.case_id} value={c.case_id}>
                {c.case_id} · {c.parent_asin} · score {c.forensic_signal_score}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="case-b">
            Case B
          </label>
          <select
            id="case-b"
            className="input"
            value={bId}
            onChange={(e) => setBId(e.target.value)}
          >
            {cases.map((c) => (
              <option key={c.case_id} value={c.case_id}>
                {c.case_id} · {c.parent_asin} · score {c.forensic_signal_score}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <CompareColumn
          slot="A"
          caseData={caseA}
          factors={factorsA}
          otherKeys={keysB}
        />
        <CompareColumn
          slot="B"
          caseData={caseB}
          factors={factorsB}
          otherKeys={keysA}
        />
      </div>

      <section className="card animate-fade-up mt-6 p-6 sm:p-8">
        <h2 className="text-lg font-bold tracking-tight">Difference summary</h2>
        <ul className="mt-4 space-y-3 text-sm leading-relaxed">
          <li className="flex gap-3">
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-coral" />
            <span>
              <span className="font-semibold">Signals only in {caseA.case_id}: </span>
              {onlyA.length > 0
                ? onlyA.map((f) => `${f.label} (+${f.points})`).join(", ")
                : "none — every fired signal in A also fires in B."}
            </span>
          </li>
          <li className="flex gap-3">
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-sky" />
            <span>
              <span className="font-semibold">Signals only in {caseB.case_id}: </span>
              {onlyB.length > 0
                ? onlyB.map((f) => `${f.label} (+${f.points})`).join(", ")
                : "none — every fired signal in B also fires in A."}
            </span>
          </li>
          <li className="flex gap-3">
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-sage" />
            <span>
              <span className="font-semibold">Shared signals: </span>
              {shared.length > 0
                ? shared.map((f) => `${f.label} (+${f.points})`).join(", ")
                : "none in common."}
            </span>
          </li>
          <li className="flex gap-3">
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-butter" />
            <span>
              <span className="font-semibold">Cascade rule for A: </span>
              rule {ruleAIndex} — <span className="font-mono text-xs">{ruleA.condition}</span>{" "}
              → {ruleA.verdict}.{" "}
              <span className="font-semibold">Cascade rule for B: </span>
              rule {ruleBIndex} — <span className="font-mono text-xs">{ruleB.condition}</span>{" "}
              → {ruleB.verdict}.
            </span>
          </li>
        </ul>
        <div className="mt-5 rounded-2xl border border-line bg-butter/40 px-4 py-3 text-sm font-semibold leading-relaxed">
          {rankStatement(caseA, caseB, onlyA.map((f) => f.label), onlyB.map((f) => f.label))}
        </div>
      </section>
    </div>
  );
}

function cascadeIndexOf(ruleKey: string): number {
  return VERDICT_CASCADE.findIndex((rule) => rule.ruleKey === ruleKey) + 1;
}

function rankStatement(
  a: VerdictCase,
  b: VerdictCase,
  onlyALabels: string[],
  onlyBLabels: string[]
): string {
  const sa = a.forensic_signal_score;
  const sb = b.forensic_signal_score;
  if (sa !== sb) {
    const higher = sa > sb ? a : b;
    const lower = sa > sb ? b : a;
    const extras = (sa > sb ? onlyALabels : onlyBLabels).slice(0, 3);
    return (
      `${higher.case_id} ranks higher than ${lower.case_id}: ` +
      `${Math.max(sa, sb)} vs ${Math.min(sa, sb)} points` +
      (extras.length > 0 ? `, driven by extra points from ${extras.join(", ")}.` : ".")
    );
  }
  if (a.likelihood_confidence_pct !== b.likelihood_confidence_pct) {
    const higher = a.likelihood_confidence_pct > b.likelihood_confidence_pct ? a : b;
    const lower = higher === a ? b : a;
    return (
      `${higher.case_id} ranks higher: both score ${sa} points, but its clustering is less likely by chance ` +
      `(${higher.likelihood_confidence_pct}% vs ${lower.likelihood_confidence_pct}% confidence).`
    );
  }
  if (a.forensic_verdict !== b.forensic_verdict) {
    return (
      `Both cases score ${sa} points with equal likelihood; the cascade separates them ` +
      `(${a.forensic_verdict} vs ${b.forensic_verdict}).`
    );
  }
  return `Both cases rank equally: ${sa} points, ${a.cooccurrence_likelihood.toLowerCase()} likelihood, ${a.forensic_verdict}.`;
}

function CompareColumn({
  slot,
  caseData,
  factors,
  otherKeys
}: {
  slot: "A" | "B";
  caseData: VerdictCase;
  factors: ReturnType<typeof firedFactors>;
  otherKeys: Set<string>;
}) {
  const metrics: { label: string; render: () => React.ReactNode }[] = [
    {
      label: "Score",
      render: () => (
        <span className="text-lg font-bold">
          {caseData.forensic_signal_score}
          <span className="ml-1 text-xs font-medium text-ink-faint">pts</span>
        </span>
      )
    },
    { label: "Priority", render: () => <TierBadge tier={caseData.investigation_priority} /> },
    {
      label: "Likelihood",
      render: () => (
        <LikelihoodBadge
          band={caseData.cooccurrence_likelihood}
          confidence={caseData.likelihood_confidence_pct}
        />
      )
    },
    {
      label: "p-value",
      render: () => <span className="font-mono text-xs font-semibold">{caseData.cooccurrence_surprise_p.toFixed(4)}</span>
    },
    { label: "Verdict", render: () => <VerdictBadge verdict={caseData.forensic_verdict} /> },
    {
      label: "Dominant domain",
      render: () => (
        <span className="text-xs font-semibold">
          {DOMAIN_LABELS_LOCAL[caseData.dominant_signal_domain]}
        </span>
      )
    },
    { label: "Rating", render: () => <span className="text-xs font-bold">{caseData.rating}★</span> },
    { label: "ASIN", render: () => <span className="font-mono text-xs font-semibold">{caseData.parent_asin}</span> }
  ];

  return (
    <section className="card animate-fade-up p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-ink text-xs font-bold text-canvas">
            {slot}
          </span>
          <span className="font-mono text-sm font-bold tracking-tight">{caseData.case_id}</span>
        </div>
        <span className="pill bg-white border border-line">
          <span className="h-2 w-2 rounded-full bg-lilac" />
          Case {slot}
        </span>
      </div>

      <dl className="mt-4 divide-y divide-line/60">
        {metrics.map((m) => (
          <div key={m.label} className="flex items-center justify-between gap-3 py-2.5">
            <dt className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
              {m.label}
            </dt>
            <dd className="text-right">{m.render()}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-4 border-t border-line pt-4">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-sm font-bold tracking-tight">Fired signals</h3>
          <span className="text-[11px] font-semibold text-ink-faint">{factors.length} signals</span>
        </div>
        <ul className="mt-3 space-y-2">
          {factors.map((f) => {
            const exclusive = !otherKeys.has(f.key);
            return (
              <li
                key={f.key}
                className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2 text-xs ${
                  exclusive ? "border-ink/25 bg-butter/40" : "border-line bg-canvas"
                }`}
              >
                <span className="font-semibold">{f.label}</span>
                <span className="flex items-center gap-2">
                  {exclusive && (
                    <span className="pill bg-white !py-0.5 !px-2 !text-[10px]">only in {slot}</span>
                  )}
                  <span className="font-bold">+{f.points}</span>
                </span>
              </li>
            );
          })}
          {factors.length === 0 && (
            <li className="text-xs muted">No factor points allocated for this case.</li>
          )}
        </ul>
      </div>
    </section>
  );
}
