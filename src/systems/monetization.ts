import type { PlatformFeature, ServerRack } from '../types';
import type { MonetizationStrategy } from '../store/gameStore';

export interface RevenueBreakdown {
  ads: number;
  subscription: number;
  b2b: number;
  freemium: number;
  total: number;
  hasSubscription: boolean;
  uptimePenalty: number;
}

export interface MonetizationOptions {
  strategy: MonetizationStrategy;
  productId: string | null;
  dataRatio: number;
  synergyActive: boolean;
  pricingRevenueMult?: number;
  researchAdRevMult?: number;
  researchSubRevMult?: number;
}

export interface MonetizationMods {
  growthMult: number;
  churnDelta: number;
}

function hasActivePaymentGateway(features: PlatformFeature[]): boolean {
  return features.some(f => f.id === 'payment_gateway' && f.level > 0 && f.enabled);
}

function getFeatureLevel(features: PlatformFeature[], id: string): number {
  const f = features.find(x => x.id === id && x.enabled);
  return f && f.level > 0 ? f.level : 0;
}

function hasCrashedNodes(racks: ServerRack[]): boolean {
  return racks.some(r => r.slots.some(s => s.node?.status === 'crashed'));
}

// §1 — Ads Tier linear, berbasis level fitur "Ad Platform Interface"
export function getAdPlatformLevel(features: PlatformFeature[]): number {
  return getFeatureLevel(features, 'ad_platform');
}

export function adsRevenuePer100Users(level: number): number {
  if (level <= 0) return 2;
  return 2 + (level - 1) * 1.5;
}

export function calculateAdsRevenue(
  users: number,
  racks: ServerRack[],
  adPlatformLevel: number,
  strategy: MonetizationStrategy,
  synergyActive: boolean,
  dataRatio: number,
): number {
  const penalty = hasCrashedNodes(racks) ? 0.5 : 1.0;

  // 'none' / belum ada Ad Platform → flat $2/100 (backward compatible)
  if (strategy === 'none' || adPlatformLevel <= 0) {
    return Math.round((users / 100) * 2 * penalty);
  }

  let per100 = adsRevenuePer100Users(adPlatformLevel);

  // Banner/Video & Targeted Ads baru aktif di atas Lv.5; di bawahnya tetap flat $2
  const requiresLv5 = strategy === 'video_ads' || strategy === 'targeted_ads';
  if (requiresLv5 && adPlatformLevel < 5) {
    per100 = 2;
  }

  let revenue = (users / 100) * per100 * penalty;

  if (strategy === 'targeted_ads') {
    // ×1.5 hanya kalau Synergy aktif DAN Data compliance ratio >= 100%; else cap ×1.0
    const multiplier = synergyActive && dataRatio >= 1 ? 1.5 : 1.0;
    revenue *= multiplier;
  }

  return Math.round(revenue);
}

// §2 — B2B Search API (Search Engine eksklusif)
export function calculateB2BRevenue(
  features: PlatformFeature[],
  productId: string | null,
  dataRatio: number,
): number {
  if (productId !== 'search_engine') return 0;
  const level = getFeatureLevel(features, 'b2b_search_api');
  if (level <= 0) return 0;
  const ratio = Math.min(dataRatio, 1.5);
  return Math.round(level * 150 * ratio);
}

// §3 — Subscription rebalance ($2.50/user, was $2)
export function calculateSubscriptionRevenue(users: number, features: PlatformFeature[]): number {
  if (!hasActivePaymentGateway(features)) return 0;
  return Math.round(users * 2.5);
}

// §3 — Freemium (5% premium users, $3/bulan, tanpa penalti)
export function calculateFreemiumRevenue(users: number): number {
  return Math.round(users * 0.05 * 3);
}

// §3 — Growth / churn modifier berdasar strategi aktif (dipakai di tick loop)
export function getMonetizationMods(strategy: MonetizationStrategy): MonetizationMods {
  if (strategy === 'subscription') return { growthMult: 0.65, churnDelta: -0.00005 };
  if (strategy === 'video_ads') return { growthMult: 1, churnDelta: 0.0001 };
  return { growthMult: 1, churnDelta: 0 };
}

// User Mood (kepuasan) — digabung ke churn, bukan sistem mandiri.
// Mood drift ke target per strategi tiap tick; selisih dari baseline menambah churn.
export const MOOD_BASELINE = 80;
export const MOOD_DRIFT_RATE = 0.03;
export const MOOD_PENALTY_K = 0.00004;

export function getMoodTarget(strategy: MonetizationStrategy, synergyActive: boolean, dataRatio: number): number {
  switch (strategy) {
    case 'none': return 85;          // bersih, sedikit positif
    case 'text_ads': return 72;      // intrusif ringan
    case 'video_ads': return 55;     // intrusif sedang
    case 'targeted_ads': return synergyActive && dataRatio >= 1 ? 78 : 45; // relevan vs anjlok
    case 'freemium': return 80;      // netral
    case 'subscription': return 92;  // premium → user betah
  }
}

export function calculateRevenue(
  users: number,
  features: PlatformFeature[],
  racks: ServerRack[],
  cohesionMult: number = 1,
  synergyRevenueBonus: number = 0,
  opts?: MonetizationOptions,
): RevenueBreakdown {
  const strategy = opts?.strategy ?? 'none';
  const productId = opts?.productId ?? null;
  const dataRatio = opts?.dataRatio ?? 1;
  const synergyActive = opts?.synergyActive ?? false;

  const penalty = hasCrashedNodes(racks) ? 0.5 : 1.0;
  const effectiveUsers = Math.round(users * cohesionMult);

  const adPlatformLevel = getAdPlatformLevel(features);
  let ads = calculateAdsRevenue(effectiveUsers, racks, adPlatformLevel, strategy, synergyActive, dataRatio);

  let subscription = 0;
  let freemium = 0;

  if (strategy === 'none') {
    // Legacy exact: ads flat + subscription ($2/user) bila Payment Gateway aktif
    subscription = hasActivePaymentGateway(features) ? Math.round(effectiveUsers * 2) : 0;
  } else if (strategy === 'subscription') {
    subscription = calculateSubscriptionRevenue(effectiveUsers, features);
  } else if (strategy === 'freemium') {
    freemium = calculateFreemiumRevenue(effectiveUsers);
  }

  const b2b = calculateB2BRevenue(features, productId, dataRatio);

  subscription = Math.round(subscription * (1 + synergyRevenueBonus));
  freemium = Math.round(freemium * (1 + synergyRevenueBonus));

  const pricingMult = opts?.pricingRevenueMult ?? 1;
  const adRevMult = opts?.researchAdRevMult ?? 1;
  const subRevMult = opts?.researchSubRevMult ?? 1;
  ads = Math.round(ads * adRevMult);
  subscription = Math.round(subscription * subRevMult);
  const total = Math.round((ads + subscription + freemium + b2b) * pricingMult);
  const hasSubscription = subscription > 0;
  return { ads, subscription, b2b, freemium, total, hasSubscription, uptimePenalty: penalty };
}
