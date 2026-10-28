import fs from "fs";
import path from "path";
import { DOMAIN_COLOR, LIKELIHOOD_STYLE, TIER_STYLE, VERDICT_STYLE } from "@/components/Visuals";
import { COMPONENT_CONDITIONS, COMPONENT_LABELS, DOMAIN_LABELS } from "@/lib/labels";
import { PRIORITY_DISPLAY, VERDICT_CASCADE, VERDICT_DISPLAY } from "@/lib/rules";

function readFile(name: string): any {
  return JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", name), "utf-8"));
}

export default function SignalsPage() {
  const rules = readFile("scoring_rules.json");
  const context = readFile("context.json");

  const weights: Record<string, number> = rules.component_weights;
  const firingRates: Record<string, number> = context.component_firing_rates;
  const domains: Record<string, string[]> = rules.domains;
  const signalFlags: Record<string, string> = rules.signal_flags;
  const componentKeys = Object.keys(weights);
  const totalPoints = componentKeys.reduce((acc, key) => acc + (weights[key] || 0), 0);

  const domainEntries = Object.entries(domains) as [string, string[]][];
  const flagEntries = Object.entries(signalFlags) as [string, string][];

  const domainOf = (key: string) => domainEntries.find(([, members]) => members.includes(key))?.[0] ?? null;
  const flagOf = (key: string) => flagEntries.find(([, component]) => component === key)?.[0] ?? null;

  const cascadeRows = (Object.entries(rules.verdict_rules) as [string, string][]).map(
    ([ruleKey, condition]) => ({
      ruleKey,
      condition,
      verdict: VERDICT_DISPLAY[ruleKey] || ruleKey,
      trigger: VERDICT_CASCADE.find((r) => r.ruleKey === ruleKey)?.trigger || ""
    })
  );

  const priorityRows = (Object.entries(rules.priority_bins) as [string, (number | null)[]][]).map(
    ([key, range]) => {
      const min = range[0] ?? 0;
      const max = range[1];
      return {
        key,
        tier: PRIORITY_DISPLAY[key] || key,
        range: max === null || max === undefined ? `${min}+` : `${min} – ${max}`
      };
    }
  );

  const lb = rules.likelihood_bands;
  const likelihoodRows = [
    { band: "Very strong", condition: `p < ${Number(lb.very_strong_max_p).toFixed(2)}` },
    {
      band: "Strong",
      condition: `${Number(lb.very_strong_max_p).toFixed(2)} ≤ p < ${Number(lb.strong_max_p).toFixed(2)}`
    },
    {
      band: "Moderate",
      condition: `${Number(lb.strong_max_p).toFixed(2)} ≤ p < ${Number(lb.moderate_max_p).toFixed(2)}`
    },
    { band: "Weak", condition: `p ≥ ${Number(lb.moderate_max_p).toFixed(2)}` }
  ];

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:py-14">
      <div className="animate-fade-up mb-8 max-w-2xl">
        <span className="pill bg-sky/40 mb-4">
          <span className="h-2 w-2 rounded-full bg-sky" />
          Signals reference
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
          Components, cascade, bands
        </h1>
        <p className="mt-3 text-sm sm:text-base leading-relaxed muted max-w-xl">
          The scoring exports in one place: every evidence component with its weight and
          empirical firing rate, plus the verdict, priority and likelihood rules.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <span className="pill bg-ink text-canvas">{componentKeys.length} components · {totalPoints} points</span>
        <span className="pill bg-butter/50">
          Null model: seed {rules.null_model.seed} · {Number(rules.null_model.simulations).toLocaleString()} sims
        </span>
        {domainEntries.map(([key]) => (
          <span key={key} className="pill bg-white border border-line">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: DOMAIN_COLOR[key] }} />
            {(DOMAIN_LABELS as Record<string, string>)[key] || key}
          </span>
        ))}
      </div>

      <section className="card animate-fade-up p-6 sm:p-8">
        <div className="mb-6">
          <h2 className="text-lg font-bold tracking-tight">Evidence components</h2>
          <p className="mt-1.5 max-w-2xl text-xs leading-relaxed muted">
            Weight is the point value contributed when the component fires; firing rate is the
            share of the population sample where it fired.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left">
            <thead>
              <tr className="border-b border-line text-[10px] font-bold uppercase tracking-wider text-ink-faint">
                <th className="py-2.5 pr-3">Component</th>
                <th className="py-2.5 pr-3">Domain</th>
                <th className="py-2.5 pr-3">Weight</th>
                <th className="py-2.5 pr-3">Fires when</th>
                <th className="py-2.5 pr-3">Firing rate</th>
              </tr>
            </thead>
            <tbody>
              {componentKeys.map((key) => {
                const domainKey = domainOf(key);
                const rate = (firingRates[key] || 0) * 100;
                const flag = flagOf(key);
                return (
                  <tr key={key} className="border-b border-line/60 transition hover:bg-canvas">
                    <td className="py-3 pr-3">
                      <div className="text-sm font-semibold">{COMPONENT_LABELS[key as keyof typeof COMPONENT_LABELS] || key}</div>
                      {flag && <div className="font-mono text-[10px] text-ink-faint">{flag}</div>}
                    </td>
                    <td className="py-3 pr-3">
                      {domainKey ? (
                        <span className="flex items-center gap-1.5 text-xs font-semibold">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: DOMAIN_COLOR[domainKey] }}
                          />
                          {(DOMAIN_LABELS as Record<string, string>)[domainKey] || domainKey}
                        </span>
                      ) : (
                        <span className="text-xs muted">score only</span>
                      )}
                    </td>
                    <td className="py-3 pr-3 text-xs font-bold">{weights[key]} pts</td>
                    <td className="py-3 pr-3 text-xs muted">
                      {COMPONENT_CONDITIONS[key as keyof typeof COMPONENT_CONDITIONS] || "—"}
                    </td>
                    <td className="py-3 pr-3 text-xs font-semibold">{rate.toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs leading-relaxed muted">
          <span className="font-semibold">evidence_rating</span> is the 1–2 star selection
          criterion: it adds points to the score but belongs to no forensic domain.
        </p>
      </section>

      <section className="card animate-fade-up mt-6 p-6 sm:p-8">
        <div className="mb-6">
          <h2 className="text-lg font-bold tracking-tight">Verdict cascade</h2>
          <p className="mt-1.5 max-w-2xl text-xs leading-relaxed muted">
            Rules run top to bottom; the first triggered rule decides the verdict.
          </p>
        </div>
        <div className="space-y-3">
          {cascadeRows.map((row, i) => {
            const style = VERDICT_STYLE[row.verdict] || VERDICT_STYLE["Routine complaint"];
            return (
              <div
                key={row.ruleKey}
                className="flex flex-col gap-2 rounded-2xl border border-line bg-canvas px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-ink text-xs font-bold text-canvas">
                    {i + 1}
                  </span>
                  <span className={`pill ${style.bg}`}>
                    <span className={`h-2 w-2 rounded-full ${style.dot}`} />
                    {row.verdict}
                  </span>
                </div>
                <div className="sm:text-right">
                  <div className="font-mono text-[11px] font-semibold text-ink">{row.condition}</div>
                  <div className="mt-0.5 text-[11px] leading-snug muted">{row.trigger}</div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="card animate-fade-up p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-lg font-bold tracking-tight">Priority bands</h2>
            <p className="mt-1.5 text-xs leading-relaxed muted">
              Total score decides the investigation tier.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-line text-[10px] font-bold uppercase tracking-wider text-ink-faint">
                  <th className="py-2.5 pr-3">Score</th>
                  <th className="py-2.5">Tier</th>
                </tr>
              </thead>
              <tbody>
                {priorityRows.map((row) => (
                  <tr key={row.key} className="border-b border-line/60">
                    <td className="py-3 pr-3 text-xs font-bold">{row.range}</td>
                    <td className="py-3">
                      <span className={`pill ${TIER_STYLE[row.tier]?.bg || "bg-line"}`}>
                        <span
                          className={`h-2 w-2 rounded-full ${TIER_STYLE[row.tier]?.dot || "bg-line"}`}
                        />
                        {row.tier}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card animate-fade-up p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-lg font-bold tracking-tight">Likelihood bands</h2>
            <p className="mt-1.5 text-xs leading-relaxed muted">
              Surprise p-value from the seeded null model.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-line text-[10px] font-bold uppercase tracking-wider text-ink-faint">
                  <th className="py-2.5 pr-3">p-value</th>
                  <th className="py-2.5">Band</th>
                </tr>
              </thead>
              <tbody>
                {likelihoodRows.map((row) => (
                  <tr key={row.band} className="border-b border-line/60">
                    <td className="py-3 pr-3 font-mono text-xs font-semibold">{row.condition}</td>
                    <td className="py-3">
                      <span className={`pill ${LIKELIHOOD_STYLE[row.band]?.bg || "bg-line"}`}>
                        {row.band}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
