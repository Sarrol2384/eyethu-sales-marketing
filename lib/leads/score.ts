import "server-only";
import type { LeadCategory, MoveTimeline } from "@/lib/supabase/types";

export type ScoreLeadInput = {
  isFirstTimeBuyer: boolean;
  moveTimeline: MoveTimeline | null | undefined;
  hasEmail: boolean;
  hasMessage: boolean;
  propertyPrice: number | null;
};

export type ScoreLeadResult = {
  score: number;
  category: LeadCategory;
  reasons: string[];
};

/**
 * Deterministic, rule-based lead scoring (BANT-ish, tuned for SA property).
 *
 * This is intentionally simple — phase 9 will layer an AI summary on top via
 * Claude. For phase 5 we just need *something* to drive the hot/warm/cold
 * routing and the admin UI's score bar without paying for an LLM call on
 * every form submission.
 *
 * Bands:
 *   75-100 hot     — wants to move soon AND high signal
 *   40-74  warm    — interested but not urgent
 *    0-39  cold    — early/browsing
 */
export function scoreLead(input: ScoreLeadInput): ScoreLeadResult {
  let score = 30;
  const reasons: string[] = [];

  switch (input.moveTimeline) {
    case "asap":
      score += 40;
      reasons.push("Moving ASAP (+40)");
      break;
    case "1_3_months":
      score += 30;
      reasons.push("Moving in 1–3 months (+30)");
      break;
    case "3_6_months":
      score += 15;
      reasons.push("Moving in 3–6 months (+15)");
      break;
    case "6_plus_months":
      score += 5;
      reasons.push("Moving in 6+ months (+5)");
      break;
    case "just_browsing":
      score -= 10;
      reasons.push("Just browsing (-10)");
      break;
    default:
      break;
  }

  if (input.hasEmail) {
    score += 10;
    reasons.push("Provided email (+10)");
  }
  if (input.hasMessage) {
    score += 5;
    reasons.push("Wrote a message (+5)");
  }
  if (input.isFirstTimeBuyer) {
    score += 5;
    reasons.push("First-time buyer (+5)");
  }

  if (typeof input.propertyPrice === "number" && input.propertyPrice > 0) {
    if (input.propertyPrice <= 1_000_000) {
      score += 5;
      reasons.push("Affordable price band (+5)");
    } else if (input.propertyPrice >= 3_000_000) {
      score -= 5;
      reasons.push("Premium price band (-5)");
    }
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  let category: LeadCategory;
  if (score >= 75) category = "hot";
  else if (score >= 40) category = "warm";
  else category = "cold";

  return { score, category, reasons };
}
