import type { PlatformFeature, GameEvent, FeatureGroup } from '../types';
import { getProductDef } from '../data/products';
import type { SynergyPair } from '../data/products';

const GROUP_WEIGHT: Record<FeatureGroup, number> = { core: 3, business: 2, engagement: 1 };

export interface PlatformStats {
  totalTraffic: number;
  targetUsers: number;
  rps: number;
  effectiveRps: number;
  cohesionScore: number;
  synergyTrafficBonus: number;
  synergyRevenueBonus: number;
}

function getSynergies(productId: string | null): SynergyPair[] {
  if (!productId) return [];
  const product = getProductDef(productId);
  return product?.synergies ?? [];
}

export function calcCohesion(features: PlatformFeature[]): number {
  const built = features.filter(f => f.level > 0 && f.enabled);
  if (built.length <= 1) return 1.0;

  const totalWeight = built.reduce((s, f) => s + GROUP_WEIGHT[f.group], 0);
  const avgLevel = built.reduce((s, f) => s + f.level, 0) / built.length;

  const weightedDev = built.reduce((s, f) =>
    s + Math.abs(f.level - avgLevel) * GROUP_WEIGHT[f.group], 0
  );

  const maxDev = Math.max(avgLevel, 1) * totalWeight;
  return Math.max(0, Math.min(1, 1 - weightedDev / maxDev));
}

export function calcSynergyBonus(features: PlatformFeature[], productId: string | null): { trafficBonus: number; revenueBonus: number } {
  const synergies = getSynergies(productId);
  let trafficBonus = 0;
  let revenueBonus = 0;

  for (const pair of synergies) {
    const a = features.find(f => f.id === pair.featureA);
    const b = features.find(f => f.id === pair.featureB);
    if (!a || !b) continue;
    if (!a.enabled || !b.enabled) continue;
    if (a.level < pair.minLevel || b.level < pair.minLevel) continue;
    if (Math.abs(a.level - b.level) > pair.maxLevelGap) continue;

    trafficBonus += pair.trafficBonus;
    revenueBonus += pair.revenueBonus;
  }

  return { trafficBonus, revenueBonus };
}

export function getAppliedEffects(events: GameEvent[]): {
  rpsMult: number;
  userGrowthMult: number;
  revenueMult: number;
  crashChanceBonus: number;
} {
  let rpsMult = 1;
  let userGrowthMult = 1;
  let revenueMult = 1;
  let crashChanceBonus = 0;

  for (const ev of events) {
    if (ev.effects.rpsMultiplier) rpsMult *= ev.effects.rpsMultiplier;
    if (ev.effects.userGrowthMultiplier) userGrowthMult *= ev.effects.userGrowthMultiplier;
    if (ev.effects.revenueMultiplier) revenueMult *= ev.effects.revenueMultiplier;
    if (ev.effects.crashChanceBonus) crashChanceBonus += ev.effects.crashChanceBonus;
  }

  return { rpsMult, userGrowthMult, revenueMult, crashChanceBonus };
}

export function getPlatformStats(
  features: PlatformFeature[],
  events: GameEvent[],
  productId: string | null,
): PlatformStats {
  const rawTraffic = features.reduce(
    (sum, f) => sum + (f.level > 0 && f.enabled ? f.trafficGenerated : 0), 0
  );

  const synergy = calcSynergyBonus(features, productId);
  const synergyTrafficBonus = Math.round(rawTraffic * synergy.trafficBonus);
  const totalTraffic = rawTraffic + synergyTrafficBonus;

  const cohesionScore = calcCohesion(features);
  const effects = getAppliedEffects(events);

  const rps = totalTraffic;
  const cohesionRpsPenalty = 1.3 - 0.3 * cohesionScore;
  const effectiveRps = Math.round(rps * effects.rpsMult * cohesionRpsPenalty);

  return {
    totalTraffic,
    targetUsers: totalTraffic,
    rps,
    effectiveRps,
    cohesionScore,
    synergyTrafficBonus,
    synergyRevenueBonus: synergy.revenueBonus,
  };
}
