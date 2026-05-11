/**
 * Lead Scoring Engine
 * Scores HVAC contractor leads by estimated revenue opportunity and fit
 */

export interface RawLead {
  name: string;
  phone?: string;
  website?: string;
  address?: string;
  city: string;
  state?: string;
  rating?: number;
  reviewCount: number;
  placeId?: string;
  types?: string[];         // Google Places types
}

export interface ScoredLead extends RawLead {
  estimatedTechs: number;
  leadScore: number;         // 0–100
  outreachAngle: string;
  isChain: boolean;
  priorityTier: "A" | "B" | "C" | "skip";
}

// ─── CHAIN DETECTION ──────────────────────────────────────────────────────────
const CHAIN_KEYWORDS = [
  "one hour", "1-800", "one hour heating", "aire serv", "service experts",
  "lennox", "carrier", "trane", "comfort systems", "ars rescue rooter",
  "cool today", "abacus", "bob hamilton", "fred's", "lee company",
  "southern company", "rescue rooter", "roto-rooter",
];

export function isChainBusiness(name: string): boolean {
  const lower = name.toLowerCase();
  return CHAIN_KEYWORDS.some((kw) => lower.includes(kw));
}

// ─── TECHNICIAN ESTIMATION ────────────────────────────────────────────────────
// Heuristic: log(reviewCount) × adjustment factor
// 50 reviews ≈ 3–5 techs | 150 reviews ≈ 6–10 | 400+ reviews ≈ 12–25
export function estimateTechCount(reviewCount: number, hasWebsite: boolean): number {
  if (reviewCount === 0) return 2;
  const base = Math.round(Math.log(reviewCount + 1) * 2.2);
  const websiteBonus = hasWebsite ? 1 : 0;
  return Math.min(Math.max(base + websiteBonus, 2), 35);
}

// ─── IDEAL CUSTOMER PROFILE ───────────────────────────────────────────────────
// Sweet spot: 5–20 techs, high ratings (credibility), mid review count (not chain)
function reviewCountScore(count: number): number {
  if (count < 10) return 10;
  if (count < 30) return 40;
  if (count < 80) return 70;    // ideal range start
  if (count < 200) return 100;  // ideal range peak
  if (count < 400) return 75;   // getting big
  return 45;                    // likely too large or chain
}

function ratingScore(rating?: number): number {
  if (!rating) return 30;
  if (rating >= 4.7) return 100;
  if (rating >= 4.4) return 85;
  if (rating >= 4.0) return 65;
  if (rating >= 3.5) return 40;
  return 20;
}

function techCountScore(techs: number): number {
  if (techs < 3) return 20;
  if (techs < 5) return 55;
  if (techs <= 15) return 100;  // sweet spot
  if (techs <= 25) return 75;
  return 40;
}

function hasWebsiteScore(website?: string): number {
  return website ? 20 : 0;
}

// ─── OUTREACH ANGLE SELECTOR ──────────────────────────────────────────────────
function selectOutreachAngle(
  techs: number,
  reviewCount: number,
  rating?: number
): string {
  if (techs >= 10) {
    return "fleet_scale"; // Focus on fleet-wide revenue loss
  }
  if (reviewCount >= 100 && rating && rating >= 4.5) {
    return "growth_momentum"; // High-rated, growing business
  }
  if (techs <= 5) {
    return "small_team_roi"; // Every tech hour matters more
  }
  return "routing_waste"; // Default: travel time / idle time angle
}

// ─── PRIORITY TIER ────────────────────────────────────────────────────────────
function getPriorityTier(score: number, isChain: boolean, techs: number): "A" | "B" | "C" | "skip" {
  if (isChain || techs < 2 || techs > 40) return "skip";
  if (score >= 75) return "A";
  if (score >= 50) return "B";
  if (score >= 30) return "C";
  return "skip";
}

// ─── MAIN SCORER ──────────────────────────────────────────────────────────────
export function scoreLead(raw: RawLead): ScoredLead {
  const isChain = isChainBusiness(raw.name);
  const techs = estimateTechCount(raw.reviewCount, !!raw.website);

  const score = isChain
    ? 0
    : Math.round(
        reviewCountScore(raw.reviewCount) * 0.35 +
        ratingScore(raw.rating) * 0.25 +
        techCountScore(techs) * 0.30 +
        hasWebsiteScore(raw.website) * 0.10
      );

  return {
    ...raw,
    estimatedTechs: techs,
    leadScore: score,
    outreachAngle: isChain ? "skip" : selectOutreachAngle(techs, raw.reviewCount, raw.rating),
    isChain,
    priorityTier: getPriorityTier(score, isChain, techs),
  };
}

export function scoreLeads(leads: RawLead[]): ScoredLead[] {
  return leads
    .map(scoreLead)
    .filter((l) => l.priorityTier !== "skip")
    .sort((a, b) => b.leadScore - a.leadScore);
}
