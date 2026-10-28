export const VERDICT_STYLE: Record<string, { bg: string; fg: string; dot: string; tone: string }> = {
  "Routine complaint": { bg: "bg-sky/25", fg: "text-ink", dot: "bg-sky", tone: "Routine" },
  "Authentic complaint likely": { bg: "bg-sage/30", fg: "text-ink", dot: "bg-sage", tone: "Authentic" },
  "Reviewer fraud pattern": { bg: "bg-butter/35", fg: "text-ink", dot: "bg-butter", tone: "Fraud risk" },
  "Coordinated negative campaign pattern": { bg: "bg-lilac/35", fg: "text-ink", dot: "bg-lilac", tone: "Sabotage risk" },
  "Content authenticity concern": { bg: "bg-coral/30", fg: "text-ink", dot: "bg-coral", tone: "Integrity risk" }
};

export const LIKELIHOOD_STYLE: Record<string, { bg: string; label: string }> = {
  "Very strong": { bg: "bg-ink text-canvas", label: "Very strong" },
  Strong: { bg: "bg-ink/85 text-canvas", label: "Strong" },
  Moderate: { bg: "bg-lilac/50 text-ink", label: "Moderate" },
  Weak: { bg: "bg-line text-ink-soft", label: "Weak" }
};

export const TIER_STYLE: Record<string, { bg: string; dot: string }> = {
  "Routine review": { bg: "bg-sky/25", dot: "bg-sky" },
  "Contextual examination": { bg: "bg-butter/35", dot: "bg-butter" },
  "High-priority examination": { bg: "bg-coral/35", dot: "bg-coral" }
};

export const DOMAIN_LABELS_LOCAL: Record<string, string> = {
  reviewer_fraud: "Reviewer fraud",
  coordinated_sabotage: "Coordinated sabotage",
  content_authenticity: "Content authenticity",
  evidence_integrity: "Evidence integrity"
};

export const DOMAIN_COLOR: Record<string, string> = {
  reviewer_fraud: "#EFDC7C",
  coordinated_sabotage: "#CDB8EC",
  content_authenticity: "#EF9A80",
  evidence_integrity: "#AFC6E9"
};

export function VerdictBadge({ verdict, large }: { verdict: string; large?: boolean }) {
  const style = VERDICT_STYLE[verdict] || VERDICT_STYLE["Routine complaint"];
  return (
    <span
      className={`pill ${style.bg} ${style.fg} ${large ? "!px-4 !py-2 !text-sm" : ""}`}
    >
      <span className={`h-2 w-2 rounded-full ${style.dot}`} />
      {verdict}
    </span>
  );
}

export function LikelihoodBadge({ band, confidence }: { band: string; confidence?: number }) {
  const style = LIKELIHOOD_STYLE[band] || LIKELIHOOD_STYLE.Weak;
  return (
    <span className={`pill ${style.bg}`}>
      {style.label}
      {confidence !== undefined ? ` · ${confidence}%` : ""}
    </span>
  );
}

export function TierBadge({ tier }: { tier: string }) {
  const style = TIER_STYLE[tier] || TIER_STYLE["Routine review"];
  return (
    <span className={`pill ${style.bg}`}>
      <span className={`h-2 w-2 rounded-full ${style.dot}`} />
      {tier}
    </span>
  );
}

export function ScoreGauge({ score, max, tier }: { score: number; max: number; tier: string }) {
  const pct = Math.max(0, Math.min(100, (score / max) * 100));
  const color = TIER_STYLE[tier]?.dot || "bg-sky";
  return (
    <div className="w-full">
      <div className="relative h-3 w-full overflow-hidden rounded-full bg-line">
        <div
          className={`absolute inset-y-0 left-0 rounded-full ${color} transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
        <div className="absolute inset-y-0 left-[45%] w-px bg-white/70" />
        <div className="absolute inset-y-0 left-[72%] w-px bg-white/70" />
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] font-medium text-ink-faint">
        <span>0</span>
        <span>6 · contextual</span>
        <span>10 · high</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

export function MiniStat({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-line bg-white px-4 py-3">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
        {label}
      </span>
      <span className={`text-xl font-bold tracking-tight ${accent || ""}`}>{value}</span>
    </div>
  );
}

export function BarRow({
  label,
  value,
  max,
  color,
  right
}: {
  label: string;
  value: number;
  max: number;
  color: string;
  right?: string;
}) {
  const pct = max > 0 ? Math.max(2, (value / max) * 100) : 0;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xs font-semibold">{label}</span>
        <span className="text-xs font-medium muted">{right ?? value}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-line">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
