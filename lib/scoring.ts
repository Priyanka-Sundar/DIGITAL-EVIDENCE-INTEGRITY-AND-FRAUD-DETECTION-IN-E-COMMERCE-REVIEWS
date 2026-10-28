import fs from "fs";
import path from "path";
import {
  AnalyzeRequest,
  AnalyzeResponse,
  ComponentKey,
  ComponentResult,
  DomainKey,
  LikelihoodBand,
  PriorityTier,
  Verdict
} from "./types";
import { chiSquareCdf, detectCategories, matchTemplatedPhrases, mulberry32 } from "./text";
import { COMPONENT_KEYS, COMPONENT_LABELS, DOMAIN_LABELS, DOMAIN_OF } from "./labels";

const DATA_DIR = path.join(process.cwd(), "data");

// Label/domain tables live in lib/labels.ts so client components can reuse them
// without pulling fs into the browser bundle; re-exported here for compatibility.
export { COMPONENT_KEYS, COMPONENT_LABELS, DOMAIN_LABELS, DOMAIN_OF };

export const CUSTOMER_GUIDANCE: Record<Verdict, string> = {
  "Routine complaint": "This looks like a routine complaint. Judge the product on the substance of the complaint rather than on manipulation concerns.",
  "Authentic complaint likely": "This looks like an authentic complaint. The customer's experience is likely genuine; weigh it when deciding on the product.",
  "Reviewer fraud pattern": "This review shows a pattern associated with manipulated feedback. Give it less weight and check other high-confidence reviews.",
  "Coordinated negative campaign pattern": "Multiple independent signals suggest coordinated negative activity. Do not treat this review as a standalone product defect report.",
  "Content authenticity concern": "The content itself shows authenticity problems such as reused imagery. Verify the listing visuals independently before trusting the claims."
};

export interface ContextBundle {
  component_firing_rates: Record<string, number>;
  component_weights: Record<string, number>;
  population_moments: { mean: Record<string, number>; std: Record<string, number> };
  monthly_burst_lookup: Record<string, number | null>;
  category_product_mean_rating: number;
  product_lookup: Record<string, { mean_rating: number; review_count: number; one_star_ratio: number; complaint_ratio: number }>;
  templated_phrases: { text: string; occurrences: number; distinct_products: number }[];
}

let contextCache: ContextBundle | null = null;
export function getContext(): ContextBundle {
  if (!contextCache) {
    contextCache = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "context.json"), "utf-8")) as ContextBundle;
  }
  return contextCache;
}

export function getWeights(): Record<ComponentKey, number> {
  return getContext().component_weights as Record<ComponentKey, number>;
}

function priorityTier(score: number): PriorityTier {
  if (score >= 10) return "High-priority examination";
  if (score >= 6) return "Contextual examination";
  return "Routine review";
}

function likelihoodBand(p: number): { band: LikelihoodBand; confidence: number } {
  const confidence = Math.round((1 - p) * 1000) / 10;
  if (p < 0.01) return { band: "Very strong", confidence };
  if (p < 0.05) return { band: "Strong", confidence };
  if (p < 0.1) return { band: "Moderate", confidence };
  return { band: "Weak", confidence };
}

function domainSums(flags: Record<ComponentKey, 0 | 1>, weights: Record<ComponentKey, number>): Record<DomainKey, number> {
  const totals: Record<DomainKey, number> = { reviewer_fraud: 0, coordinated_sabotage: 0, content_authenticity: 0, evidence_integrity: 0 };
  for (const key of COMPONENT_KEYS) {
    const domain = DOMAIN_OF[key];
    if (domain && flags[key] > 0) totals[domain] += weights[key];
  }
  return totals;
}

function chooseVerdict(sums: Record<DomainKey, number>, score: number): Verdict {
  if (sums.content_authenticity >= 2) return "Content authenticity concern";
  if (sums.coordinated_sabotage >= 3) return "Coordinated negative campaign pattern";
  if (sums.reviewer_fraud >= 5) return "Reviewer fraud pattern";
  if (sums.evidence_integrity >= 2 && score <= 5) return "Authentic complaint likely";
  return "Routine complaint";
}

function dominantDomain(sums: Record<DomainKey, number>, total: number): DomainKey {
  if (total === 0) return "evidence_integrity";
  return Object.entries(sums).sort((a, b) => b[1] - a[1])[0][0] as DomainKey;
}

function monteCarloNull(firingRates: Record<string, number>, weights: Record<ComponentKey, number>, observedScore: number, seed: number, sims: number): number {
  const rnd = mulberry32(seed);
  const keys = COMPONENT_KEYS.filter((k) => k !== "evidence_image_reuse");
  let count = 0;
  for (let i = 0; i < sims; i += 1) {
    let total = 0;
    for (const k of keys) {
      if (rnd() < firingRates[k]) total += weights[k];
    }
    if (total >= observedScore) count += 1;
  }
  return count / sims;
}

export function analyze(req: AnalyzeRequest): AnalyzeResponse {
  const ctx = getContext();
  const weights = getWeights();
  const text = (req.review_text || "").trim();
  const categories = detectCategories(text);

  const flags = {} as Record<ComponentKey, 0 | 1>;
  const observed = {} as Record<ComponentKey, string>;
  for (const key of COMPONENT_KEYS) {
    flags[key] = 0;
    observed[key] = "";
  }

  const rating = Number(req.rating) || 5;
  flags.evidence_rating = rating <= 2 ? 1 : 0;
  observed.evidence_rating = `Rating ${rating} of 5`;

  flags.evidence_complaint = categories.length >= 2 ? 1 : 0;
  observed.evidence_complaint = categories.length > 0 ? `Complaint themes: ${categories.join(", ")}` : "No complaint themes detected";

  flags.evidence_image = req.has_image ? 1 : 0;
  observed.evidence_image = req.has_image ? "Review includes an image" : "No review image";

  flags.evidence_unverified = req.verified_purchase === false ? 1 : 0;
  observed.evidence_unverified = req.verified_purchase === false ? "Unverified purchase" : "Verified purchase or not specified";

  const productKey = (req.asin || "").trim();
  const product = productKey ? ctx.product_lookup[productKey] : undefined;
  const catMean = ctx.category_product_mean_rating || 1.36;
  if (product) {
    flags.evidence_rating_deviation = rating <= 2 && product.mean_rating > catMean + 0.5 ? 1 : 0;
    observed.evidence_rating_deviation = `Product mean ${product.mean_rating} vs category ${catMean.toFixed(2)}`;
  } else {
    flags.evidence_rating_deviation = 0;
    observed.evidence_rating_deviation = "Product history not available for this ASIN";
  }

  const reviewCount = req.reviewer_review_count ?? 0;
  flags.evidence_activity = reviewCount >= 30 ? 1 : 0;
  observed.evidence_activity = `Reviewer has ${reviewCount} reviews`;

  const negRatio = Math.max(0, Math.min(1, req.reviewer_negative_ratio ?? 0));
  flags.evidence_negative_behavior = negRatio >= 0.6 && reviewCount >= 5 ? 1 : 0;
  observed.evidence_negative_behavior = `Negative ratio ${(negRatio * 100).toFixed(0)}% across ${reviewCount} reviews`;

  const phrase = matchTemplatedPhrases(text, ctx.templated_phrases);
  flags.evidence_text_repetition = phrase && phrase.similarity >= 0.75 ? 1 : 0;
  observed.evidence_text_repetition = phrase
    ? `Best phrase similarity ${(phrase.similarity * 100).toFixed(0)}% against ${phrase.occurrences} prior copies`
    : "No templated phrase match";

  const month = (req.review_month || "").trim();
  const burstRatio = month ? ctx.monthly_burst_lookup[month] ?? null : null;
  flags.evidence_temporal = burstRatio !== null && burstRatio >= 1.5 ? 1 : 0;
  observed.evidence_temporal = burstRatio !== null ? `Burst ratio ${burstRatio.toFixed(2)} in ${month}` : "No burst data for this month";

  const productCount = req.reviewer_product_count ?? 0;
  flags.evidence_network = productCount >= 10 ? 1 : 0;
  observed.evidence_network = `Reviewer active on ${productCount} products`;

  const moments = ctx.population_moments;
  const reviewerVector: Record<string, number> = {
    review_count: reviewCount,
    mean_rating: rating,
    negative_ratio: negRatio,
    one_star_ratio: rating === 1 ? 1 : 0,
    complaint_ratio: Math.min(1, categories.length / 6),
    image_ratio: req.has_image ? 1 : 0,
    product_count: productCount,
    mean_text_length: Math.min(2000, text.length),
    helpful_vote_total: 0,
    network_degree: productCount
  };
  let zSum = 0;
  let zCount = 0;
  for (const [col, mean] of Object.entries(moments.mean)) {
    const std = moments.std[col] || 0;
    if (std > 0) {
      zSum += Math.abs(((reviewerVector[col] ?? 0) - mean) / std);
      zCount += 1;
    }
  }
  const zAvg = zCount > 0 ? zSum / zCount : 0;
  flags.evidence_anomaly = zAvg >= 1.5 ? 1 : 0;
  observed.evidence_anomaly = `Average reviewer z-score ${zAvg.toFixed(2)}`;

  flags.evidence_image_reuse = 0;
  observed.evidence_image_reuse = "Per-image perceptual hashing runs in the notebook pipeline";

  let score = 0;
  for (const key of COMPONENT_KEYS) {
    score += flags[key] * weights[key];
  }

  const firingRates = ctx.component_firing_rates;
  const sums = domainSums(flags, weights);
  const assessableKeys = COMPONENT_KEYS.filter((k) => k !== "evidence_image_reuse");
  const expectedScore = assessableKeys.reduce((acc, k) => acc + (firingRates[k] || 0) * weights[k], 0);
  const variance = assessableKeys.reduce((acc, k) => {
    const p = firingRates[k] || 0;
    return acc + weights[k] * weights[k] * p * (1 - p);
  }, 0);
  const z = variance > 0 ? (score - expectedScore) / Math.sqrt(variance) : 0;
  const chiP = 1 - chiSquareCdf(Math.max(z * z, 0), 1);
  const mcP = monteCarloNull(firingRates, weights, score, 42, 5000);
  const combinedP = Math.max(0.0001, Math.min(1, (chiP + mcP) / 2));

  const verdict = chooseVerdict(sums, score);
  const totalFiredPoints = COMPONENT_KEYS.reduce((acc, k) => acc + (flags[k] > 0 ? weights[k] : 0), 0);
  const dominant = dominantDomain(sums, totalFiredPoints);
  const band = likelihoodBand(combinedP);
  const tier = priorityTier(score);
  const maxPoints = COMPONENT_KEYS.reduce((acc, k) => acc + weights[k], 0);
  const firedKeys = COMPONENT_KEYS.filter((k) => flags[k] > 0);

  const components: ComponentResult[] = COMPONENT_KEYS.map((key) => ({
    key,
    label: COMPONENT_LABELS[key],
    domain: DOMAIN_OF[key] ?? null,
    points: flags[key] * weights[key],
    max_points: weights[key],
    assessable: key !== "evidence_image_reuse",
    fired: flags[key] > 0,
    observed: observed[key],
    interpretation: flags[key] > 0
      ? `${COMPONENT_LABELS[key]} contributed ${weights[key]} point${weights[key] > 1 ? "s" : ""} to the evidence score.`
      : `${COMPONENT_LABELS[key]} did not fire for this review.`,
    forensic_relevance: DOMAIN_OF[key]
      ? `Domain: ${DOMAIN_LABELS[DOMAIN_OF[key]]}.`
      : "Domain: score-only signal (the 1-2 star rating is the selection criterion, not a domain indicator)."
  }));

  const why: string[] = firedKeys.map((key) => `${COMPONENT_LABELS[key]}: ${observed[key]}`);
  if (why.length === 0) why.push("No forensic signal components fired; the review falls in the routine range.");

  const actions: string[] = [];
  if (tier === "High-priority examination") actions.push("Escalate to manual review with priority handling.");
  if (verdict === "Reviewer fraud pattern") actions.push("Cross-check the reviewer's full history for coordinated behavior.");
  if (verdict === "Coordinated negative campaign pattern") actions.push("Group similar reviews and inspect posting-time clustering.");
  if (verdict === "Content authenticity concern") actions.push("Run perceptual-hash image verification on the listing gallery.");
  if (actions.length === 0) actions.push("Standard monitoring is sufficient for this case.");

  return {
    case_id: `WEB-${Date.now().toString(36).toUpperCase()}`,
    forensic_signal_score: score,
    assessable_points: score,
    max_points: maxPoints,
    assessable_components: assessableKeys.length,
    total_components: COMPONENT_KEYS.length,
    investigation_priority: tier,
    null_expected_score: Math.round(expectedScore * 100) / 100,
    cooccurrence_surprise_p: Math.round(combinedP * 100000) / 100000,
    likelihood_confidence_pct: band.confidence,
    cooccurrence_likelihood: band.band,
    dominant_signal_domain: dominant,
    forensic_verdict: verdict,
    customer_guidance: CUSTOMER_GUIDANCE[verdict],
    investigative_conclusion: `${firedKeys.length} of ${COMPONENT_KEYS.length} forensic signals fired for a score of ${score}. The signal combination is ${band.band.toLowerCase()} against the population null model (p = ${combinedP.toFixed(4)}). Dominant domain: ${DOMAIN_LABELS[dominant]}.`,
    signal_flags: flags,
    components,
    why_this_verdict: why,
    recommended_actions: actions,
    alternative_explanations: [
      "A genuinely defective product batch can mimic several of these signals.",
      "A promotional price change can cause a legitimate rating swing."
    ],
    generated_at: new Date().toISOString()
  };
}
