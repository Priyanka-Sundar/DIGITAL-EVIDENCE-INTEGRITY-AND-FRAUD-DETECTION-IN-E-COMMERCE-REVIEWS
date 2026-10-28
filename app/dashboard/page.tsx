"use client";

import { useDashboardData } from "@/lib/useDashboard";
import { AreaLineChart, ColumnChart, DonutChart, Heatmap, HBarChart } from "@/components/Charts";
import { DOMAIN_COLOR, LikelihoodBadge, VerdictBadge } from "@/components/Visuals";

export default function DashboardPage() {
  const { data, error, loading } = useDashboardData();

  if (loading) return <DashboardSkeleton />;
  if (error || !data) return <DashboardError message={error || "No data."} />;

  const d = data;
  const maxScoreCount = Math.max(...d.score_distribution.map((s) => s.count));
  const verdictRows = d.verdict_likelihood_matrix.map((r) => r.verdict as string);
  const likelihoodCols = ["Very strong", "Strong", "Moderate", "Weak"];
  const matrixValues = d.verdict_likelihood_matrix.map((r) =>
    likelihoodCols.map((c) => Number(r[c] ?? 0))
  );

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:py-14">
      <div className="animate-fade-up mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="pill bg-lilac/40">
            <span className="h-2 w-2 rounded-full bg-lilac" />
            Notebook full-run outputs
          </span>
          <h1 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight">
            Forensic dashboard
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed muted">
            Population-level results from the {d.dataset.reviews_analyzed.toLocaleString()} negative{" "}
            {d.dataset.category} reviews analyzed in the forensic notebook. Every metric below is
            produced by the offline pipeline, not simulated.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          ["Reviews analyzed", d.dataset.reviews_analyzed.toLocaleString()],
          ["Unique reviewers", d.dataset.unique_reviewers.toLocaleString()],
          ["Products covered", d.dataset.unique_products.toLocaleString()],
          ["Months span", d.dataset.months_covered.toLocaleString()],
          ["Burst months", `${d.burst_months}`],
          ["Flagged reviewers", d.anomaly.flagged_reviewers.toLocaleString()]
        ].map(([label, value]) => (
          <div key={label} className="card card-hover px-4 py-4">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
              {label}
            </div>
            <div className="mt-1 text-xl font-bold tracking-tight">{value}</div>
          </div>
        ))}
      </div>

      <Section title="Score distribution" subtitle="How the 0–22 evidence-point scale spreads across cases, split by investigation tier.">
        <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
          <div>
            <ColumnChart
              data={d.score_distribution.map((s) => ({
                label: String(s.score),
                value: s.count,
                color: s.color
              }))}
              valueFormat={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v))}
            />
            <div className="mt-4 flex flex-wrap gap-4 text-[11px] font-semibold">
              {[["Routine", "#AFC6E9"], ["Contextual", "#EFDC7C"], ["High-priority", "#EF9A80"]].map(([l, c]) => (
                <span key={l} className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c }} />
                  {l}
                </span>
              ))}
            </div>
          </div>
          <div>
            <DonutChart data={d.priority_mix.map((p) => ({ label: p.tier, value: p.count, color: p.color }))} />
          </div>
        </div>
      </Section>

      <Section title="Verdict mix" subtitle="The forensic verdict assigned to each case by the ordered rule cascade.">
        <div className="grid gap-8 lg:grid-cols-2">
          <DonutChart data={d.verdict_mix.map((v) => ({ label: v.verdict, value: v.count, color: v.color }))} />
          <div>
            <h3 className="mb-4 text-sm font-bold tracking-tight">Likelihood strength</h3>
            <HBarChart
              data={d.likelihood_mix.map((l) => ({
                label: l.band,
                value: l.count,
                sub: `${l.share_pct}%`,
                pct: `${l.share_pct}%`,
                color: l.band === "Very strong" ? "#211D18" : l.band === "Strong" ? "#6B6259" : l.band === "Moderate" ? "#CDB8EC" : "#AFC6E9"
              }))}
              valueFormat={(v) => v.toLocaleString()}
            />
            <p className="mt-4 text-xs leading-relaxed muted">
              Bands come from a seeded Monte-Carlo null model: the chance that independent signals
              co-occur at this density by chance. Lower p means a more unusual clustering.
            </p>
          </div>
        </div>
      </Section>

      <Section title="Signal domains & component contribution" subtitle="Which forensic domains fire most often, and which evidence components drive the population score.">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <h3 className="mb-4 text-sm font-bold tracking-tight">Domain prevalence</h3>
            <HBarChart
              data={d.domain_prevalence.map((dom) => ({
                label: dom.label,
                value: dom.cases_with_signal_pct,
                sub: `mean ${dom.mean_score}`,
                color: DOMAIN_COLOR[dom.key]
              }))}
              valueFormat={(v) => `${v}%`}
            />
          </div>
          <div>
            <h3 className="mb-4 text-sm font-bold tracking-tight">Component contribution</h3>
            <HBarChart
              data={d.component_contribution.map((c) => ({
                label: c.label,
                value: c.points,
                sub: `${c.firing_rate_pct}% fire · wt ${c.weight}`,
                pct: `${c.share_pct}% of points`,
                color: "#EFDC7C"
              }))}
              valueFormat={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))}
            />
          </div>
        </div>
      </Section>

      <Section title="Temporal concentration" subtitle={`Review volume across ${d.dataset.months_covered} months (${d.dataset.period_start} to ${d.dataset.period_end}); coral dots mark burst months.`}>
        <AreaLineChart
          points={d.monthly_series.map((m) => ({
            label: m.month,
            value: m.count,
            burst: m.is_burst,
            baseline: m.baseline,
            burstRatio: m.burst_ratio
          }))}
        />
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            ["Burst months", `${d.burst_months} of ${d.dataset.months_covered}`, "Months where volume exceeded the rolling baseline by 1.5×."],
            ["Peak interpretation", d.monthly_series.reduce((a, b) => (a.count > b.count ? a : b)).interpretation, "The single highest-volume month in the series."],
            ["Verified share", `${d.dataset.verified_share_pct}%`, "Share of analyzed reviews marked as verified purchases."]
          ].map(([label, value, desc]) => (
            <div key={label} className="rounded-2xl border border-line bg-canvas px-4 py-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">{label}</div>
              <div className="mt-0.5 text-sm font-bold leading-tight">{value}</div>
              <p className="mt-1 text-[11px] leading-snug muted">{desc}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Complaint themes" subtitle="Dictionary-based complaint categories detected across the negative-review sample.">
        <HBarChart
          data={d.complaint_categories.map((c, i) => ({
            label: c.category,
            value: c.share_pct,
            sub: `${c.count.toLocaleString()} reviews`,
            pct: `${c.share_pct}%`,
            color: ["#F4B8D0", "#EFDC7C", "#BFD6A3", "#AFC6E9", "#CDB8EC", "#EF9A80"][i % 6]
          }))}
          valueFormat={(v) => `${v}%`}
        />
      </Section>

      <Section title="Text & image forensics" subtitle="Near-duplicate wording detection and perceptual-hash image reuse across listings.">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-line bg-canvas p-6">
            <h3 className="text-sm font-bold tracking-tight">Templated text audit</h3>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {[
                ["Sample audited", d.text_audit.sample_size.toLocaleString()],
                ["Near-duplicate pairs", d.text_audit.similar_reviews.toLocaleString()],
                ["Same-product repeats", d.text_audit.same_product.toLocaleString()],
                ["Cross-product repeats", d.text_audit.cross_product.toLocaleString()]
              ].map(([l, v]) => (
                <div key={l} className="rounded-2xl border border-line bg-white px-3.5 py-3">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">{l}</div>
                  <div className="mt-0.5 text-lg font-bold">{v}</div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs leading-relaxed muted">
              Reviews sharing a Dice similarity of {d.text_audit.threshold} or higher are counted.
              Cross-product repeats are the stronger signal: identical wording across unrelated listings.
            </p>
          </div>

          <div className="rounded-3xl border border-line bg-canvas p-6">
            <h3 className="text-sm font-bold tracking-tight">Image reuse (perceptual hash)</h3>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {[
                ["Cases with images", d.image_forensics.cases_with_images.toLocaleString()],
                ["Images hashed", d.image_forensics.images_hashed.toLocaleString()],
                ["Reuse pairs found", d.image_forensics.reuse_pairs.toLocaleString()],
                ["Cross-product reuse", d.image_forensics.reuse_cross_product.toLocaleString()]
              ].map(([l, v]) => (
                <div key={l} className="rounded-2xl border border-line bg-white px-3.5 py-3">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">{l}</div>
                  <div className="mt-0.5 text-lg font-bold">{v}</div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs leading-relaxed muted">
              {d.image_forensics.hash_bits}-bit hashes compared at a Hamming distance of ≤
              {d.image_forensics.hamming_threshold}. {d.image_forensics.reuse_cross_product} of the{" "}
              {d.image_forensics.reuse_pairs} reuse pairs appear on different products, which
              indicates recycled imagery rather than legitimate re-uploads.
            </p>
          </div>
        </div>
      </Section>

      <Section title="Anomaly stability" subtitle="Reproducibility of the multivariate reviewer-anomaly flags across seeds.">
        <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <div className="rounded-3xl border border-line bg-canvas p-6">
            <div className="text-3xl font-bold tracking-tight">
              {((d.anomaly.flagged_reviewers / d.anomaly.total_reviewers) * 100).toFixed(1)}%
            </div>
            <div className="mt-1 text-xs font-semibold text-ink-faint">
              of reviewers flagged anomalous
            </div>
            <p className="mt-3 text-xs leading-relaxed muted">
              {d.anomaly.flagged_reviewers.toLocaleString()} of {d.anomaly.total_reviewers.toLocaleString()}{" "}
              reviewers exceeded the anomaly threshold. Stability metrics confirm the ranking is not
              an artifact of the random seed.
            </p>
          </div>
          <HBarChart
            data={d.anomaly.stability.map((s) => ({
              label: s.measure,
              value: s.value,
              color: "#BFD6A3"
            }))}
            valueFormat={(v) => (v <= 1 ? v.toFixed(3) : v.toLocaleString())}
          />
        </div>
      </Section>

      <Section title="Verdict × likelihood matrix" subtitle="How verdict classes distribute across likelihood-strength bands.">
        <Heatmap rows={verdictRows} columns={likelihoodCols} values={matrixValues} />
      </Section>

      <Section title="Highest-signal cases" subtitle="The 15 cases with the densest evidence clusters in the full run.">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left">
            <thead>
              <tr className="border-b border-line text-[10px] font-bold uppercase tracking-wider text-ink-faint">
                <th className="py-2.5 pr-3">Case</th>
                <th className="py-2.5 pr-3">ASIN</th>
                <th className="py-2.5 pr-3">★</th>
                <th className="py-2.5 pr-3">Score</th>
                <th className="py-2.5 pr-3">Signals</th>
                <th className="py-2.5 pr-3">Verdict</th>
                <th className="py-2.5 pr-3">Likelihood</th>
              </tr>
            </thead>
            <tbody>
              {d.top_cases.map((c) => (
                <tr key={c.case_id} className="border-b border-line/60 transition hover:bg-canvas">
                  <td className="py-3 pr-3 font-mono text-xs font-semibold">{c.case_id.replace("CASE-", "#")}</td>
                  <td className="py-3 pr-3 font-mono text-xs">{c.parent_asin}</td>
                  <td className="py-3 pr-3 text-xs font-semibold">{c.rating}★</td>
                  <td className="py-3 pr-3 text-xs font-bold">{c.score}</td>
                  <td className="py-3 pr-3 text-xs">{c.fired_signals}</td>
                  <td className="py-3 pr-3"><VerdictBadge verdict={c.verdict} /></td>
                  <td className="py-3 pr-3">
                    <span className="flex items-center gap-1.5">
                      <LikelihoodBadge band={c.likelihood} />
                      <span className="text-[11px] font-semibold text-ink-faint">{c.likelihood_pct}%</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs leading-relaxed muted">
          Excerpt from the top case: “{d.top_cases[0]?.excerpt}”
        </p>
      </Section>

      <Section title="Population figures" subtitle="Headline figure per analytical area, as exported by the notebook run.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {d.population_insights.map((ins) => (
            <div key={ins.area} className="rounded-3xl border border-line bg-white p-5">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-sm font-bold tracking-tight">{ins.area}</h3>
                <span className="text-lg font-bold">{ins.value}</span>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="card animate-fade-up mt-6 p-6 sm:p-8">
      <div className="mb-6">
        <h2 className="text-lg font-bold tracking-tight">{title}</h2>
        {subtitle && <p className="mt-1.5 max-w-2xl text-xs leading-relaxed muted">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-14">
      <div className="mb-8 h-9 w-64 rounded-2xl skeleton" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-20 rounded-2xl skeleton" />
        ))}
      </div>
      {[0, 1, 2].map((i) => (
        <div key={i} className="mt-6 h-72 rounded-3xl skeleton" />
      ))}
      <p className="mt-6 text-center text-sm muted">Loading notebook outputs…</p>
    </div>
  );
}

function DashboardError({ message }: { message: string }) {
  return (
    <div className="mx-auto max-w-lg px-5 py-24 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-coral/25 text-xl">
        ⚠
      </div>
      <h1 className="mt-5 text-xl font-bold tracking-tight">Dashboard unavailable</h1>
      <p className="mt-2 text-sm leading-relaxed muted">{message}</p>
      <button onClick={() => window.location.reload()} className="btn-primary mt-6">
        Retry
      </button>
    </div>
  );
}
