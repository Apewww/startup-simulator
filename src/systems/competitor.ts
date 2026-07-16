import type { CompetitorProduct, CompetitorSector, CompetitorPersonality } from '../types';
import { generateUniqueName } from '../data/competitorNames';

const SECTORS: CompetitorSector[] = ['social_media', 'ecommerce', 'search_engine'];
const PERSONALITIES: CompetitorPersonality[] = ['aggressive', 'conservative', 'opportunistic'];

// ponytail: sector multipliers, tune after playtesting
const SECTOR_REVENUE_MULT: Record<CompetitorSector, number> = {
  social_media: 8,
  ecommerce: 6,
  search_engine: 10,
};
const SECTOR_USER_VALUE: Record<CompetitorSector, number> = {
  social_media: 40,
  ecommerce: 60,
  search_engine: 30,
};

let competitorIdCounter = 0;

function nextId(): string {
  competitorIdCounter++;
  return `comp-${competitorIdCounter}`;
}

function randomPersonality(): CompetitorPersonality {
  return PERSONALITIES[Math.floor(Math.random() * PERSONALITIES.length)];
}

function pickName(usedNames: Set<string>): string {
  return generateUniqueName(usedNames);
}

export function calcValuation(
  monthlyRevenue: number,
  userCount: number,
  sector: CompetitorSector,
  cohesionScore: number,
  growthMomentum: number,
): number {
  const revenuePart = monthlyRevenue * 12 * SECTOR_REVENUE_MULT[sector];
  const userPart = userCount * SECTOR_USER_VALUE[sector];
  return Math.round((revenuePart + userPart) * cohesionScore * growthMomentum);
}

export function calcGrowthMomentum(userHistory: number[]): number {
  if (userHistory.length < 2) return 1;
  const oldest = userHistory[0];
  const latest = userHistory[userHistory.length - 1];
  if (oldest <= 0) return 1;
  return Math.max(0.5, Math.min(2, latest / oldest));
}

export function generateCompetitor(
  sector: CompetitorSector,
  currentMonth: number,
  usedNames: Set<string>,
  hotSectorBadgeTicks: number = 0,
  isUnicorn: boolean = false,
): CompetitorProduct {
  const personality = randomPersonality();
  const baseGrowth = isUnicorn ? 0.08
    : personality === 'aggressive' ? 0.04
    : personality === 'conservative' ? 0.02
    : 0.03;
  const baseVolatility = isUnicorn ? 0.20
    : personality === 'aggressive' ? 0.12
    : personality === 'conservative' ? 0.04
    : 0.08;
  const startUsers = 1_000 + Math.floor(Math.random() * 5_000);
  const startRevenue = 100 + Math.floor(Math.random() * 400);
  const startValuation = 10_000 + Math.floor(Math.random() * 40_000);
  const shareCount = 100_000 + Math.floor(Math.random() * 900_000); // 100K-1M shares
  const compId = nextId();

  return {
    id: compId,
    name: pickName(usedNames),
    sector,
    valuation: startValuation,
    growthRate: baseGrowth + (Math.random() - 0.5) * 0.02,
    volatility: baseVolatility + Math.random() * 0.03,
    personality,
    rank: 0,
    delisted: false,
    delistedAtMonth: 0,
    createdAtMonth: currentMonth,
    hotSectorBadgeTicks,
    newBadgeTicks: 2,
    userCount: startUsers,
    monthlyRevenue: startRevenue,
    userHistory: [startUsers],
    isUnicorn,
    totalShares: shareCount,
    sharePrice: Math.round(startValuation / shareCount),
    ownership: [{ ownerId: compId, percentage: 100 }],
  };
}

export function generateInitialCompetitors(currentMonth: number, count: number = 8): CompetitorProduct[] {
  const usedNames = new Set<string>();
  const competitors: CompetitorProduct[] = [];
  const sectorCounts: Record<CompetitorSector, number> = { social_media: 0, ecommerce: 0, search_engine: 0 };

  for (let i = 0; i < count; i++) {
    const sector = SECTORS[i % 3];
    const comp = generateCompetitor(sector, currentMonth, usedNames);
    usedNames.add(comp.name);
    sectorCounts[sector]++;
    competitors.push({ ...comp, newBadgeTicks: 0 });
  }

  return competitors;
}

export function updateCompetitorValuation(
  comp: CompetitorProduct,
  sectorGrowthBonus: number,
  marketEventMult: number,
): CompetitorProduct {
  if (comp.delisted) return comp;

  const noise = (Math.random() - 0.5) * 2 * comp.volatility;
  const growthMult = 1 + comp.growthRate + noise + sectorGrowthBonus;
  const newUsers = Math.round(comp.userCount * growthMult * marketEventMult);
  const newRevenue = Math.round(comp.monthlyRevenue * growthMult * marketEventMult);

  // Track user history for growth momentum (keep last 3 months)
  const userHistory = [...comp.userHistory, newUsers].slice(-3);
  const growthMomentum = calcGrowthMomentum(userHistory);
  const newValuation = calcValuation(newRevenue, newUsers, comp.sector, 1, growthMomentum);

  const finalValuation = Math.max(100, newValuation);
  return {
    ...comp,
    valuation: finalValuation,
    userCount: Math.max(10, newUsers),
    monthlyRevenue: Math.max(0, newRevenue),
    userHistory,
    sharePrice: comp.totalShares > 0 ? Math.round(finalValuation / comp.totalShares) : 0,
    hotSectorBadgeTicks: Math.max(0, comp.hotSectorBadgeTicks - 1),
    newBadgeTicks: Math.max(0, comp.newBadgeTicks - 1),
  };
}

// Player valuation using same formula for consistent ranking
export function calcPlayerValuation(
  currentUsers: number,
  monthlyRevenue: number,
  sector: CompetitorSector,
  cohesionScore: number,
): number {
  return calcValuation(monthlyRevenue, currentUsers, sector, cohesionScore, 1);
}

export function shouldDelist(comp: CompetitorProduct, _currentMonth: number): boolean {
  if (comp.delisted) return false;
  if (comp.userHistory.length < 2) return false;
  const oldest = comp.userHistory[0];
  if (oldest <= 0) return false;
  const drop = comp.userCount / oldest;
  return drop < 0.3; // >70% user drop over tracked period
}

export function checkSpawnNew(currentMonth: number, activeCount: number, hotSector?: CompetitorSector | null): boolean {
  if (activeCount >= 1000) return false;
  const baseChance = 0.15;
  const countBonus = Math.max(0, 1 - activeCount / 1000) * 0.1;
  const hotSectorBonus = hotSector ? 0.05 : 0;
  const monthBonus = currentMonth > 12 ? 0.03 : 0; // lebih banyak spawn seiring waktu
  return Math.random() < baseChance + countBonus + hotSectorBonus + monthBonus;
}

export function chooseSpawnSector(hotSector?: CompetitorSector | null): CompetitorSector {
  if (hotSector) return hotSector;
  return SECTORS[Math.floor(Math.random() * SECTORS.length)];
}

export function isUnicornSpawn(): boolean {
  return Math.random() < 0.05; // 5% chance
}

export function calcSectorGrowthBonus(
  competitors: CompetitorProduct[],
  sector: CompetitorSector,
): number {
  const sectorCompetitors = competitors.filter(c => !c.delisted && c.sector === sector);
  if (sectorCompetitors.length === 0) return 0;
  const avgGrowth = sectorCompetitors.reduce((s, c) => s + c.growthRate, 0) / sectorCompetitors.length;
  return avgGrowth * 0.3;
}

export function deduplicateNames(competitors: CompetitorProduct[]): CompetitorProduct[] {
  const seen = new Set<string>();
  return competitors.map(c => {
    if (c.delisted) return c;
    if (!seen.has(c.name)) {
      seen.add(c.name);
      return c;
    }
    const base = c.name.replace(/\d+$/, '');
    let suffix = 2;
    while (seen.has(`${base}${suffix}`)) suffix++;
    const newName = `${base}${suffix}`;
    seen.add(newName);
    return { ...c, name: newName };
  });
}

export function computeRankings(competitors: CompetitorProduct[]): CompetitorProduct[] {
  const active = competitors
    .filter(c => !c.delisted)
    .sort((a, b) => b.valuation - a.valuation);

  const ranked = active.map((c, i) => ({ ...c, rank: i + 1 }));
  const delisted = competitors.filter(c => c.delisted);
  return [...ranked, ...delisted];
}

export function resetCompetitorIdCounter(): void {
  competitorIdCounter = 0;
}
