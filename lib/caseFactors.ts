import { ComponentKey, DomainKey, VerdictCase } from "./types";
import { COMPONENT_LABELS, DOMAIN_OF } from "./labels";

export interface DerivedFactor {
  key: ComponentKey;
  label: string;
  domain: DomainKey | null;
  points: number;
  max_points: number;
  fired: boolean;
  interpretation: string;
}

// The v5 notebook export stores each case's fired evidence components (factors with the
// exact points awarded). When present, deriveCaseFactors() uses them directly. Older
// exports carry only the score and dominant domain, so the function falls back to an
// exhaustive subset search: allocations must sum exactly to the case score, and the one
// placing the most points in the dominant domain wins. Deterministic (first best mask in
// canonical order wins ties).
export function deriveCaseFactors(
  c: VerdictCase,
  weights: Record<string, number>,
  domains: Record<string, string[]>
): DerivedFactor[] {
  const keys = Object.keys(weights) as ComponentKey[];

  if (c.factors && c.factors.some((f) => f.points > 0)) {
    const pointsByKey = new Map<ComponentKey, number>(
      c.factors.map((f) => [f.key, f.points])
    );
    return keys.map((key) => {
      const weight = weights[key] || 0;
      const awarded = pointsByKey.get(key) || 0;
      const fired = awarded > 0;
      return {
        key,
        label: COMPONENT_LABELS[key] || key,
        domain: DOMAIN_OF[key] ?? null,
        points: fired ? awarded : 0,
        max_points: weight,
        fired,
        interpretation: fired
          ? `${COMPONENT_LABELS[key] || key} contributed ${awarded} point${awarded > 1 ? "s" : ""} to the case score.`
          : `${COMPONENT_LABELS[key] || key} did not fire for this case.`
      };
    });
  }

  const target = c.forensic_signal_score;
  const dominant = new Set<string>(domains[c.dominant_signal_domain] || []);

  let bestMask = -1;
  let bestRank = -1;
  for (let mask = 0; mask < 1 << keys.length; mask += 1) {
    let sum = 0;
    let dominantPoints = 0;
    let firedCount = 0;
    for (let i = 0; i < keys.length; i += 1) {
      if ((mask & (1 << i)) === 0) continue;
      const w = weights[keys[i]] || 0;
      sum += w;
      firedCount += 1;
      if (dominant.has(keys[i])) dominantPoints += w;
    }
    if (sum !== target) continue;
    const rank = dominantPoints * 100 + firedCount;
    if (rank > bestRank) {
      bestRank = rank;
      bestMask = mask;
    }
  }

  if (bestMask < 0) {
    // Fallback: greedy fill (a weight-1 component exists, so this only fires if the
    // score is unreachable — defensive rather than expected).
    let remaining = target;
    bestMask = 0;
    for (let i = 0; i < keys.length && remaining > 0; i += 1) {
      const w = weights[keys[i]] || 0;
      if (w <= remaining) {
        bestMask |= 1 << i;
        remaining -= w;
      }
    }
  }

  return keys.map((key, i) => {
    const weight = weights[key] || 0;
    const fired = (bestMask & (1 << i)) !== 0;
    return {
      key,
      label: COMPONENT_LABELS[key] || key,
      domain: DOMAIN_OF[key] ?? null,
      points: fired ? weight : 0,
      max_points: weight,
      fired,
      interpretation: fired
        ? `${COMPONENT_LABELS[key] || key} contributed ${weight} point${weight > 1 ? "s" : ""} to the case score.`
        : `${COMPONENT_LABELS[key] || key} did not fire for this case.`
    };
  });
}

export function firedFactors(factors: DerivedFactor[]): DerivedFactor[] {
  return factors.filter((f) => f.fired);
}
