import type { AdLead, AdCampaign } from '../types';
import { TICKS_PER_DAY } from '../store/gameStore';
import { CLIENT_NAMES } from '../data/clientNames';

let leadCounter = 0;
let campaignCounter = 0;

export function newAdLeadId(): string {
  leadCounter++;
  return `lead-${leadCounter}-${Date.now().toString(36)}`;
}

export function newAdCampaignId(): string {
  campaignCounter++;
  return `cmp-${campaignCounter}-${Date.now().toString(36)}`;
}

export function calcSearchDuration(specialistLevel: number): number {
  return Math.max(24, 50 - specialistLevel * 2.6);
}

export function calcNegotiationDuration(specialistLevel: number): number {
  return Math.max(12, 30 - specialistLevel * 2);
}

export function calcLeadExpiryDays(specialistLevel: number): number {
  let base = 0;
  if (specialistLevel <= 3) base = 0;
  else if (specialistLevel <= 6) base = 1;
  else if (specialistLevel <= 9) base = 2;
  else base = 3;
  return Math.max(1, Math.random() * 6 + 1 + base);
}

export interface AdSalesContext {
  currentUsers: number;
  adPlatformLevel: number;
  dataRatio: number;
  userMood: number;
  synergyActive: boolean;
  specialistLevel: number;
  productFeaturesLevel: number;
}

function pickRandomClient(exclude: string[]): string {
  const pool = CLIENT_NAMES.filter(c => !exclude.includes(c));
  if (pool.length === 0) return CLIENT_NAMES[Math.floor(Math.random() * CLIENT_NAMES.length)];
  return pool[Math.floor(Math.random() * pool.length)];
}

export function calcFeatureAdjustedBudgetRange(
  users: number, 
  adPlatformLevel: number, 
  productFeaturesLevel: number, 
  dataRatio: number, 
  synergyActive: boolean,
  specialistLevel: number
): { min: number; max: number; count: number } {
  const baseRanges = {
    enterprise: { min: 10_000, max: 50_000, count: 3 },
    medium: { min: 2_000, max: 10_000, count: 2 },
    small: { min: 500, max: 2_000, count: 1 },
  };

  const userTier = users >= 100_000 ? 'enterprise' : users >= 20_000 ? 'medium' : 'small';
  let range = baseRanges[userTier];

  const platformMultiplier = calcAdPlatformMult(adPlatformLevel);
  const dataMultiplier = dataRatio >= 1 ? 1.2 : 1.0;
  const synergyMultiplier = synergyActive ? 1.1 : 1.0;
  const specialistMultiplier = 1 + (specialistLevel * 0.05);

  const minAdjusted = Math.round(range.min * platformMultiplier * dataMultiplier * synergyMultiplier * specialistMultiplier);
  const maxAdjusted = Math.round(range.max * platformMultiplier * dataMultiplier * synergyMultiplier * specialistMultiplier);
  const countAdjusted = Math.max(1, Math.min(5, range.count + Math.floor(productFeaturesLevel / 2)));

  const finalMin = Math.max(100, Math.min(100_000, minAdjusted));
  const finalMax = Math.max(finalMin + 500, Math.min(200_000, maxAdjusted));

  return { min: finalMin, max: finalMax, count: countAdjusted };
}

export function calcFeatureAdjustedBudgetMin(
  users: number,
  adPlatformLevel: number,
  productFeaturesLevel: number,
  dataRatio: number,
  synergyActive: boolean,
  specialistLevel: number
): number {
  const baseMin = users >= 100_000 ? 10_000 : users >= 20_000 ? 2_000 : 500;
  const platformMultiplier = calcAdPlatformMult(adPlatformLevel);
  const dataMultiplier = dataRatio >= 1 ? 1.2 : 1.0;
  const synergyMultiplier = synergyActive ? 1.1 : 1.0;
  const specialistMultiplier = 1 + (specialistLevel * 0.05);
  
  let adjusted = baseMin * platformMultiplier * dataMultiplier * synergyMultiplier * specialistMultiplier;
  
  if (productFeaturesLevel > 0) adjusted *= (1 + productFeaturesLevel * 0.1);
  
  return Math.max(100, Math.min(100_000, Math.round(adjusted)));
}

export function calcFeatureAdjustedBudgetMax(
  users: number,
  adPlatformLevel: number,
  productFeaturesLevel: number,
  dataRatio: number,
  synergyActive: boolean,
  specialistLevel: number
): number {
  const baseMax = users >= 100_000 ? 50_000 : users >= 20_000 ? 10_000 : 2_000;
  const platformMultiplier = calcAdPlatformMult(adPlatformLevel);
  const dataMultiplier = dataRatio >= 1 ? 1.2 : 1.0;
  const synergyMultiplier = synergyActive ? 1.1 : 1.0;
  const specialistMultiplier = 1 + (specialistLevel * 0.05);
  
  let adjusted = baseMax * platformMultiplier * dataMultiplier * synergyMultiplier * specialistMultiplier;
  
  if (productFeaturesLevel > 0) adjusted *= (1 + productFeaturesLevel * 0.1);
  
  return Math.max(500, Math.min(200_000, Math.round(adjusted)));
}

export function generateLeads(ctx: AdSalesContext, specialistId: string, existingClients: string[], currentTick: number): AdLead[] {
  const budgetRange = calcFeatureAdjustedBudgetRange(
    ctx.currentUsers,
    ctx.adPlatformLevel,
    ctx.adPlatformLevel, // Use adPlatformLevel as proxy for product features
    ctx.dataRatio,
    ctx.synergyActive,
    1 // Default specialist level
  );
  const count = budgetRange.count;
  const leads: AdLead[] = [];
  const usedNames = new Set(existingClients);

  for (let i = 0; i < count; i++) {
    const clientName = pickRandomClient(Array.from(usedNames));
    usedNames.add(clientName);

    let matchPercent = Math.floor(Math.random() * 50) + 20;
    if (ctx.dataRatio >= 1) matchPercent += Math.min(Math.round((ctx.dataRatio - 1) * 20), 10);
    if (ctx.userMood >= 60) {}
    else matchPercent -= 10;
    if (ctx.synergyActive) matchPercent += 10;
    matchPercent = Math.max(20, Math.min(95, matchPercent));

    const budget = Math.floor(Math.random() * (budgetRange.max - budgetRange.min) + budgetRange.min);
    const days = calcLeadExpiryDays(ctx.adPlatformLevel);
    const expiresAt = currentTick + days * TICKS_PER_DAY;

    leads.push({
      id: newAdLeadId(),
      clientName,
      budget,
      matchPercent,
      expiresAt,
      status: 'pending',
      specialistId,
    });
  }

  return leads;
}

export function getMaxLeadsCount(users: number): number {
  if (users >= 100_000) return 5;
  if (users >= 20_000) return 4;
  return 3;
}

export function generateSingleLead(ctx: AdSalesContext, specialistId: string, existingClients: string[], currentTick: number): AdLead {
  const clientName = pickRandomClient(existingClients);
  let matchPercent = Math.floor(Math.random() * 50) + 20;
  if (ctx.dataRatio >= 1) matchPercent += Math.min(Math.round((ctx.dataRatio - 1) * 20), 10);
  if (ctx.userMood < 60) matchPercent -= 10;
  if (ctx.synergyActive) matchPercent += 10;
  matchPercent = Math.max(20, Math.min(95, matchPercent));

  const minBudget = calcFeatureAdjustedBudgetMin(
    ctx.currentUsers,
    ctx.adPlatformLevel,
    ctx.productFeaturesLevel,
    ctx.dataRatio,
    ctx.synergyActive,
    ctx.specialistLevel
  );
  const maxBudget = calcFeatureAdjustedBudgetMax(
    ctx.currentUsers,
    ctx.adPlatformLevel,
    ctx.productFeaturesLevel,
    ctx.dataRatio,
    ctx.synergyActive,
    ctx.specialistLevel
  );
  
  const budget = Math.floor(Math.random() * (maxBudget - minBudget) + minBudget);
  const days = calcLeadExpiryDays(ctx.adPlatformLevel);
  const expiresAt = currentTick + days * TICKS_PER_DAY;

  return {
    id: newAdLeadId(),
    clientName,
    budget,
    matchPercent,
    expiresAt,
    status: 'pending' as const,
    specialistId,
  };
}

export function calcAdPlatformMult(adPlatformLevel: number): number {
  return 1 + adPlatformLevel * 0.2;
}

export function calcPlatformMultiplier(currentUsers: number, adPlatformLevel: number, synergyActive: boolean): number {
  return 1 + (currentUsers * 0.00001 + adPlatformLevel * 0.1 + (synergyActive ? 0.2 : 0));
}

export function calcMaxBudget(budget: number, platformMult: number): number {
  return Math.round(budget * platformMult);
}

export function calcMinBudget(budget: number): number {
  return Math.round(budget * 0.4);
}

export function calcMidBudget(budget: number, platformMult: number): number {
  return Math.round((calcMinBudget(budget) + calcMaxBudget(budget, platformMult)) / 2);
}

export function calcPriceRange(budget: number, days: number, currentUsers: number, adPlatformLevel: number, synergyActive: boolean): { minPerDay: number; maxPerDay: number; midPerDay: number } {
  const mult = calcPlatformMultiplier(currentUsers, adPlatformLevel, synergyActive);
  const minTotal = calcMinBudget(budget);
  const maxTotal = calcMaxBudget(budget, mult);
  const midTotal = calcMidBudget(budget, mult);
  return {
    minPerDay: Math.ceil(minTotal / days),
    maxPerDay: Math.floor(maxTotal / days),
    midPerDay: Math.ceil(midTotal / days),
  };
}

export function calcOfferChance(totalDeal: number, budget: number): number {
  if (budget <= 0) return 0;
  const ratio = totalDeal / budget;

  // Extreme lowball — still decent but not a free win
  if (ratio < 0.2) return Math.round(70 + (ratio / 0.2) * 30);
  // Below budget — client accepts (bargain)
  if (ratio < 1.0) return 100;
  // Exactly at budget
  if (ratio === 1.0) return 90;
  // Above budget — makin mahal makin turun minat
  return Math.max(10, Math.round(90 - (ratio - 1.0) * 40));
}

export interface NegotiationContext {
  currentUsers: number;
  adPlatformLevel: number;
  synergyActive: boolean;
}

export function evaluateOffer(lead: AdLead, offeredDays: number, offeredPrice: number, ctx: NegotiationContext): { success: boolean; reason: string; chance: number } {
  const totalDeal = offeredPrice * offeredDays;

  if (offeredDays < 7) return { success: false, reason: 'Campaign too short (min 7 days)', chance: 0 };
  if (offeredPrice <= 0) return { success: false, reason: 'Invalid price', chance: 0 };

  let chance = calcOfferChance(totalDeal, lead.budget);

  // Platform quality bonus
  const platformBonus = (ctx.currentUsers * 0.00001 + ctx.adPlatformLevel * 0.05) * 20;
  chance = Math.round(Math.min(100, chance + platformBonus));
  chance = Math.max(10, chance);

  const success = Math.random() * 100 < chance;

  if (success) return { success: true, reason: 'Deal accepted', chance };

  const ratio = totalDeal / lead.budget;
  if (ratio < 0.15) return { success: false, reason: 'Price too low — looks suspicious', chance };
  if (ratio > 1.5) return { success: false, reason: `Too expensive — max $${Math.ceil(lead.budget * 1.5 / offeredDays)}/day`, chance };
  return { success: false, reason: 'Client declined', chance };
}

export function makeCampaign(lead: AdLead, dealValue: number, offeredDays: number): AdCampaign {
  const totalTicks = offeredDays * TICKS_PER_DAY;
  return {
    id: newAdCampaignId(),
    leadId: lead.id,
    clientName: lead.clientName,
    dealValue,
    offeredDays,
    revenuePerTick: Math.round(dealValue / totalTicks),
    totalTicks,
    ticksElapsed: 0,
    status: 'active',
    specialistId: lead.specialistId,
    renewalCount: 0,
  };
}

export function calcAutoRenewValue(originalValue: number, renewalCount: number): number {
  const factor = 0.90 - renewalCount * 0.05;
  const capped = Math.max(0.70, factor);
  return Math.round(originalValue * capped);
}

export function calcAutoRenewMatch(originalMatch: number, renewalCount: number): number {
  return Math.max(20, originalMatch - renewalCount * 10);
}