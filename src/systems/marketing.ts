import type { MarketingCampaign, MarketingCampaignType } from '../types';
import { getCampaignDef } from '../data/marketing';
import { TICKS_PER_DAY } from '../constants';

export function createCampaign(
  type: MarketingCampaignType,
): MarketingCampaign | null {
  const def = getCampaignDef(type);
  if (!def) return null;

  return {
    id: `mkt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    type: def.type,
    cost: def.cost,
    durationTicks: def.durationDays * TICKS_PER_DAY,
    ticksElapsed: 0,
    brandGain: def.brandGain,
    active: true,
  };
}

export function processCampaignTick(
  campaign: MarketingCampaign,
): MarketingCampaign {
  if (!campaign.active) return campaign;

  const newElapsed = campaign.ticksElapsed + 1;
  const finished = newElapsed >= campaign.durationTicks;

  return {
    ...campaign,
    ticksElapsed: newElapsed,
    active: !finished,
  };
}

export function calcBrandDecay(brandScore: number, hasActiveCampaign: boolean): number {
  if (hasActiveCampaign) return 0;
  if (brandScore <= 10) return 0;
  return Math.max(0.1, brandScore * 0.001);
}

export function calcBrandEffects(
  brandScore: number,
  campaigns: MarketingCampaign[],
  researchBrandMult: number = 1,
): { growthMult: number; churnReduction: number; moodBonus: number } {
  let growthMult = 1;
  let churnReduction = 0;
  let moodBonus = 0;

  for (const c of campaigns) {
    if (!c.active) continue;
    const def = getCampaignDef(c.type);
    if (!def) continue;
    growthMult += def.growthBonus * researchBrandMult;
    churnReduction += def.churnReduction * researchBrandMult;
    moodBonus += def.moodBonus * researchBrandMult;
  }

  const brandGrowthBonus = (brandScore / 100) * 0.1;
  growthMult += brandGrowthBonus;

  return { growthMult, churnReduction, moodBonus };
}
