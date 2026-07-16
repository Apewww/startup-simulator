import type { CompetitorProduct, CompetitorSector, CompetitorPersonality } from '../types';
import { generateUniqueName } from '../data/competitorNames';

const SECTORS: CompetitorSector[] = ['social_media', 'ecommerce', 'search_engine'];
const PERSONALITIES: CompetitorPersonality[] = ['aggressive', 'conservative', 'opportunistic'];

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

export function generateCompetitor(
  sector: CompetitorSector,
  currentMonth: number,
  usedNames: Set<string>,
  hotSectorBadgeTicks: number = 0,
): CompetitorProduct {
  const personality = randomPersonality();
  const baseGrowth = personality === 'aggressive' ? 0.04
    : personality === 'conservative' ? 0.02
    : 0.03;
  const baseVolatility = personality === 'aggressive' ? 0.12
    : personality === 'conservative' ? 0.04
    : 0.08;

  return {
    id: nextId(),
    name: pickName(usedNames),
    sector,
    valuation: 10_000 + Math.floor(Math.random() * 40_000),
    growthRate: baseGrowth + (Math.random() - 0.5) * 0.02,
    volatility: baseVolatility + Math.random() * 0.03,
    personality,
    rank: 0,
    delisted: false,
    delistedAtMonth: 0,
    createdAtMonth: currentMonth,
    hotSectorBadgeTicks,
    newBadgeTicks: 2,
    userCount: 1_000 + Math.floor(Math.random() * 5_000),
    monthlyRevenue: 100 + Math.floor(Math.random() * 400),
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
  const newValuation = Math.round(comp.valuation * growthMult * marketEventMult);
  const newUsers = Math.round(comp.userCount * growthMult);
  const newRevenue = Math.round(comp.monthlyRevenue * growthMult);

  return {
    ...comp,
    valuation: Math.max(100, newValuation),
    userCount: Math.max(10, newUsers),
    monthlyRevenue: Math.max(0, newRevenue),
    hotSectorBadgeTicks: Math.max(0, comp.hotSectorBadgeTicks - 1),
    newBadgeTicks: Math.max(0, comp.newBadgeTicks - 1),
  };
}

export function shouldDelist(comp: CompetitorProduct, _currentMonth: number): boolean {
  if (comp.delisted) return false;
  const valuationDrop = comp.valuation / (comp.valuation / (1 + comp.growthRate * 6));
  return valuationDrop < 0.3;
}

export function checkSpawnNew(_currentMonth: number, activeCount: number): boolean {
  if (activeCount >= 100) return false;
  const baseChance = 0.15;
  const countBonus = Math.max(0, 1 - activeCount / 100) * 0.1;
  return Math.random() < baseChance + countBonus;
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
