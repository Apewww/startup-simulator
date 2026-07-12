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
}

function pickRandomClient(exclude: string[]): string {
  const pool = CLIENT_NAMES.filter(c => !exclude.includes(c));
  if (pool.length === 0) return CLIENT_NAMES[Math.floor(Math.random() * CLIENT_NAMES.length)];
  return pool[Math.floor(Math.random() * pool.length)];
}

function calcBudgetRange(users: number): { min: number; max: number; count: number } {
  if (users >= 100_000) return { min: 10_000, max: 50_000, count: Math.floor(Math.random() * 3) + 2 };
  if (users >= 20_000) return { min: 2_000, max: 10_000, count: Math.floor(Math.random() * 2) + 2 };
  return { min: 500, max: 2_000, count: Math.floor(Math.random() * 2) + 1 };
}

export function generateLeads(ctx: AdSalesContext, specialistId: string, existingClients: string[]): AdLead[] {
  const budgetRange = calcBudgetRange(ctx.currentUsers);
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
    const expiresAt = Date.now() + days * TICKS_PER_DAY * 2;

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

function calcBudgetMin(users: number): number {
  if (users >= 100_000) return 10_000;
  if (users >= 20_000) return 2_000;
  return 500;
}

function calcBudgetMax(users: number): number {
  if (users >= 100_000) return 50_000;
  if (users >= 20_000) return 10_000;
  return 2_000;
}

export function generateSingleLead(ctx: AdSalesContext, specialistId: string, existingClients: string[]): AdLead {
  const clientName = pickRandomClient(existingClients);
  let matchPercent = Math.floor(Math.random() * 50) + 20;
  if (ctx.dataRatio >= 1) matchPercent += Math.min(Math.round((ctx.dataRatio - 1) * 20), 10);
  if (ctx.userMood < 60) matchPercent -= 10;
  if (ctx.synergyActive) matchPercent += 10;
  matchPercent = Math.max(20, Math.min(95, matchPercent));

  const budget = Math.floor(Math.random() * (calcBudgetMax(ctx.currentUsers) - calcBudgetMin(ctx.currentUsers)) + calcBudgetMin(ctx.currentUsers));
  const days = calcLeadExpiryDays(ctx.adPlatformLevel);
  const expiresAt = Date.now() + days * TICKS_PER_DAY * 2;

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

export function calcPriceRange(budget: number, days: number, currentUsers: number, adPlatformLevel: number, synergyActive: boolean): { minPerDay: number; maxPerDay: number } {
  const mult = calcPlatformMultiplier(currentUsers, adPlatformLevel, synergyActive);
  const minTotal = calcMinBudget(budget);
  const maxTotal = calcMaxBudget(budget, mult);
  return {
    minPerDay: Math.ceil(minTotal / days),
    maxPerDay: Math.floor(maxTotal / days),
  };
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

export interface NegotiationContext {
  currentUsers: number;
  adPlatformLevel: number;
  synergyActive: boolean;
}

export function evaluateOffer(lead: AdLead, offeredDays: number, offeredPrice: number, ctx: NegotiationContext): { success: boolean; reason: string; minPrice: number; maxPrice: number } {
  const totalDeal = offeredPrice * offeredDays;

  if (offeredDays < 7) return { success: false, reason: 'Campaign too short (min 7 days)', minPrice: 0, maxPrice: 0 };
  if (offeredPrice <= 0) return { success: false, reason: 'Invalid price', minPrice: 0, maxPrice: 0 };

  const platformMult = calcPlatformMultiplier(ctx.currentUsers, ctx.adPlatformLevel, ctx.synergyActive);
  const maxBudget = calcMaxBudget(lead.budget, platformMult);
  const minBudget = calcMinBudget(lead.budget);

  if (totalDeal < minBudget) return { success: false, reason: `Price too low — need at least $${minBudget.toLocaleString()} total`, minPrice: Math.ceil(minBudget / offeredDays), maxPrice: Math.floor(maxBudget / offeredDays) };
  if (totalDeal > maxBudget) return { success: false, reason: `Too expensive for platform value — max $${maxBudget.toLocaleString()}`, minPrice: Math.ceil(minBudget / offeredDays), maxPrice: Math.floor(maxBudget / offeredDays) };

  return { success: true, reason: 'Deal accepted', minPrice: Math.ceil(minBudget / offeredDays), maxPrice: Math.floor(maxBudget / offeredDays) };
}

export function makeCampaign(lead: AdLead, dealValue: number, offeredDays: number): AdCampaign {
  const totalTicks = offeredDays * 24;
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
