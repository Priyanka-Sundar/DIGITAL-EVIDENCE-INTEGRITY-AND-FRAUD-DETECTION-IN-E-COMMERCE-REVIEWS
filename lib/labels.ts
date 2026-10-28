import { ComponentKey, DomainKey } from "./types";

// Canonical component order used by the notebook scoring artifacts.
export const COMPONENT_KEYS: ComponentKey[] = [
  "evidence_rating",
  "evidence_complaint",
  "evidence_image",
  "evidence_unverified",
  "evidence_rating_deviation",
  "evidence_activity",
  "evidence_negative_behavior",
  "evidence_text_repetition",
  "evidence_temporal",
  "evidence_network",
  "evidence_anomaly",
  "evidence_image_reuse"
];

// Domain attribution follows the notebook's FORENSIC_DOMAINS (and scoring_rules.json).
// evidence_rating contributes to the evidence score only; it is the 1-2* selection
// criterion and is deliberately not attributed to any forensic domain.
export const DOMAIN_OF: Partial<Record<ComponentKey, DomainKey>> = {
  evidence_unverified: "reviewer_fraud",
  evidence_activity: "reviewer_fraud",
  evidence_negative_behavior: "reviewer_fraud",
  evidence_anomaly: "reviewer_fraud",
  evidence_network: "reviewer_fraud",
  evidence_temporal: "coordinated_sabotage",
  evidence_rating_deviation: "coordinated_sabotage",
  evidence_text_repetition: "content_authenticity",
  evidence_image_reuse: "content_authenticity",
  evidence_image: "evidence_integrity",
  evidence_complaint: "evidence_integrity"
};

export const COMPONENT_LABELS: Record<ComponentKey, string> = {
  evidence_rating: "Rating severity",
  evidence_complaint: "Complaint themes",
  evidence_image: "Image evidence",
  evidence_unverified: "Unverified purchase",
  evidence_rating_deviation: "Rating deviation",
  evidence_activity: "Reviewer activity",
  evidence_negative_behavior: "Negative behavior",
  evidence_text_repetition: "Text repetition",
  evidence_temporal: "Temporal burst",
  evidence_network: "Network reach",
  evidence_anomaly: "Reviewer anomaly",
  evidence_image_reuse: "Image reuse"
};

export const DOMAIN_LABELS: Record<DomainKey, string> = {
  reviewer_fraud: "Reviewer fraud",
  coordinated_sabotage: "Coordinated sabotage",
  content_authenticity: "Content authenticity",
  evidence_integrity: "Evidence integrity"
};

// Plain-language firing condition for each component. The JSON exports carry the flag
// names and weights; this map keeps the human-readable condition in one place.
export const COMPONENT_CONDITIONS: Record<ComponentKey, string> = {
  evidence_rating: "Rating of 1–2 stars",
  evidence_complaint: "Two or more complaint themes in the text",
  evidence_image: "Review includes an image",
  evidence_unverified: "Purchase is not verified",
  evidence_rating_deviation: "Product mean rating above category mean + 0.5",
  evidence_activity: "Reviewer has 30+ reviews",
  evidence_negative_behavior: "Negative ratio ≥ 60% across 5+ reviews",
  evidence_text_repetition: "Templated-phrase similarity ≥ 75%",
  evidence_temporal: "Monthly burst ratio ≥ 1.5",
  evidence_network: "Reviewer active on 10+ products",
  evidence_anomaly: "Mean reviewer z-score ≥ 1.5",
  evidence_image_reuse: "Perceptual-hash image reuse across listings (notebook pipeline)"
};
