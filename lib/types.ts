export type ComponentKey =
  | "evidence_rating"
  | "evidence_complaint"
  | "evidence_image"
  | "evidence_unverified"
  | "evidence_rating_deviation"
  | "evidence_activity"
  | "evidence_negative_behavior"
  | "evidence_text_repetition"
  | "evidence_temporal"
  | "evidence_network"
  | "evidence_anomaly"
  | "evidence_image_reuse";

export type DomainKey =
  | "reviewer_fraud"
  | "coordinated_sabotage"
  | "content_authenticity"
  | "evidence_integrity";

export type PriorityTier =
  | "Routine review"
  | "Contextual examination"
  | "High-priority examination";

export type LikelihoodBand = "Very strong" | "Strong" | "Moderate" | "Weak";

export type Verdict =
  | "Content authenticity concern"
  | "Coordinated negative campaign pattern"
  | "Reviewer fraud pattern"
  | "Authentic complaint likely"
  | "Routine complaint";

export interface AnalyzeRequest {
  review_text: string;
  rating: number;
  verified_purchase?: boolean | null;
  has_image?: boolean;
  asin?: string;
  review_month?: string;
  reviewer_review_count?: number | null;
  reviewer_negative_ratio?: number | null;
  reviewer_product_count?: number | null;
}

export interface ComponentResult {
  key: ComponentKey;
  label: string;
  domain: DomainKey | null;
  points: number;
  max_points: number;
  assessable: boolean;
  fired: boolean;
  observed: string;
  interpretation: string;
  forensic_relevance: string;
}

export interface AnalyzeResponse {
  case_id: string;
  forensic_signal_score: number;
  assessable_points: number;
  max_points: number;
  assessable_components: number;
  total_components: number;
  investigation_priority: PriorityTier;
  null_expected_score: number;
  cooccurrence_surprise_p: number;
  likelihood_confidence_pct: number;
  cooccurrence_likelihood: LikelihoodBand;
  dominant_signal_domain: DomainKey;
  forensic_verdict: Verdict;
  customer_guidance: string;
  investigative_conclusion: string;
  signal_flags: Record<ComponentKey, 0 | 1>;
  components: ComponentResult[];
  why_this_verdict: string[];
  recommended_actions: string[];
  alternative_explanations: string[];
  generated_at: string;
}

// One case from data/verdict_sample.json (the notebook's exported case sample).
export interface VerdictCase {
  case_id: string;
  review_id: number;
  user_id: string;
  parent_asin: string;
  rating: number;
  forensic_signal_score: number;
  investigation_priority: PriorityTier;
  cooccurrence_surprise_p: number;
  likelihood_confidence_pct: number;
  cooccurrence_likelihood: LikelihoodBand;
  dominant_signal_domain: DomainKey;
  forensic_verdict: Verdict;
  customer_guidance: string;
  investigative_conclusion: string;
  /** Per-case fired evidence components, as published by the v5 notebook. */
  factors?: { key: ComponentKey; points: number }[];
}

export interface DashboardData {
  generated_at: string;
  dataset: {
    category: string;
    source: string;
    reviews_analyzed: number;
    unique_reviewers: number;
    unique_products: number;
    months_covered: number;
    period_start: string | null;
    period_end: string | null;
    verified_share_pct: number;
    complaint_candidate_pct: number;
  };
  score_scale: { min: number; max: number; weight_max: number };
  score_distribution: { score: number; count: number; tier: string; color: string }[];
  priority_mix: { tier: string; count: number; share_pct: number; color: string }[];
  likelihood_mix: { band: string; count: number; share_pct: number }[];
  verdict_mix: { verdict: string; count: number; share_pct: number; color: string }[];
  domain_prevalence: { key: string; label: string; cases_with_signal_pct: number; mean_score: number; max_score: number }[];
  component_contribution: { key: string; label: string; points: number; share_pct: number; firing_rate_pct: number; weight: number }[];
  monthly_series: { month: string; count: number; baseline: number | null; burst_ratio: number | null; is_burst: boolean; interpretation: string }[];
  complaint_categories: { category: string; count: number; share_pct: number }[];
  text_audit: { sample_size: number; similar_reviews: number; same_product: number; cross_product: number; threshold: number };
  image_forensics: {
    cases_with_images: number;
    images_hashed: number;
    pairs_compared: number;
    reuse_pairs: number;
    reuse_same_product: number;
    reuse_cross_product: number;
    flagged_cases: number;
    hamming_threshold: number;
    hash_bits: number;
  };
  anomaly: {
    flagged_reviewers: number;
    total_reviewers: number;
    stability: { measure: string; value: number }[];
  };
  burst_months: number;
  population_insights: { area: string; value: string; interpretation: string; follow_up: string }[];
  verdict_likelihood_matrix: ({ verdict: string } & Record<string, number | string>)[];
  top_cases: {
    case_id: string;
    parent_asin: string;
    rating: number;
    score: number;
    priority: string;
    likelihood: string;
    likelihood_pct: number;
    verdict: string;
    dominant_domain: string;
    verdict_guidance: string;
    excerpt: string;
    fired_signals: number;
  }[];
}
