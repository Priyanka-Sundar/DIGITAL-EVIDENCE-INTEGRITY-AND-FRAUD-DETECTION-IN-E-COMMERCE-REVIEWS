// Ordered verdict cascade. The strings match data/scoring_rules.json → verdict_rules,
// so shared components (compare view, reference tables) stay in sync with the export.

export interface CascadeRule {
  ruleKey: string;
  verdict: string;
  condition: string;
  trigger: string;
}

export const VERDICT_CASCADE: CascadeRule[] = [
  {
    ruleKey: "content_authenticity_concern",
    verdict: "Content authenticity concern",
    condition: "domain_content_authenticity >= 2",
    trigger: "Content-authenticity domain sums to 2 or more points."
  },
  {
    ruleKey: "coordinated_negative_campaign_pattern",
    verdict: "Coordinated negative campaign pattern",
    condition: "domain_coordinated_sabotage >= 3",
    trigger: "Coordinated-sabotage domain sums to 3 or more points."
  },
  {
    ruleKey: "reviewer_fraud_pattern",
    verdict: "Reviewer fraud pattern",
    condition: "domain_reviewer_fraud >= 5",
    trigger: "Reviewer-fraud domain sums to 5 or more points."
  },
  {
    ruleKey: "authentic_complaint_likely",
    verdict: "Authentic complaint likely",
    condition: "domain_evidence_integrity >= 2 and forensic_signal_score <= 5",
    trigger: "Integrity domain sums to 2+ points while the total score stays at 5 or below."
  },
  {
    ruleKey: "routine_complaint",
    verdict: "Routine complaint",
    condition: "default",
    trigger: "Fallback when no earlier rule in the cascade triggers."
  }
];

export const VERDICT_DISPLAY: Record<string, string> = {
  content_authenticity_concern: "Content authenticity concern",
  coordinated_negative_campaign_pattern: "Coordinated negative campaign pattern",
  reviewer_fraud_pattern: "Reviewer fraud pattern",
  authentic_complaint_likely: "Authentic complaint likely",
  routine_complaint: "Routine complaint"
};

export const PRIORITY_DISPLAY: Record<string, string> = {
  routine_review: "Routine review",
  contextual_examination: "Contextual examination",
  high_priority_examination: "High-priority examination"
};

export function cascadeRuleFor(verdict: string): CascadeRule {
  return VERDICT_CASCADE.find((r) => r.verdict === verdict) || VERDICT_CASCADE[VERDICT_CASCADE.length - 1];
}
