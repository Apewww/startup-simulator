import type { MarketingCampaignType } from '../types/marketing';

export interface MarketingCampaignDef {
  type: MarketingCampaignType;
  name: string;
  description: string;
  cost: number;
  durationDays: number;
  brandGain: number;
  growthBonus: number;
  churnReduction: number;
  moodBonus: number;
}

export const MARKETING_CAMPAIGNS: MarketingCampaignDef[] = [
  {
    type: 'social_media_blitz',
    name: 'Social Media Blitz',
    description: 'Boost engagement across platforms. Quick burst of brand visibility.',
    cost: 2_000,
    durationDays: 30,
    brandGain: 15,
    growthBonus: 0.1,
    churnReduction: 0,
    moodBonus: 0,
  },
  {
    type: 'brand_awareness',
    name: 'Brand Awareness',
    description: 'Build long-term brand recognition. Slower burn but lasting impact.',
    cost: 5_000,
    durationDays: 60,
    brandGain: 25,
    growthBonus: 0,
    churnReduction: 0.05,
    moodBonus: 0,
  },
  {
    type: 'pr_campaign',
    name: 'PR Campaign',
    description: 'Shape public perception. Good for crisis recovery and trust building.',
    cost: 3_500,
    durationDays: 45,
    brandGain: 20,
    growthBonus: 0,
    churnReduction: 0,
    moodBonus: 5,
  },
  {
    type: 'viral_marketing',
    name: 'Viral Marketing',
    description: 'High risk, high reward. Maximum brand impact in minimum time.',
    cost: 8_000,
    durationDays: 20,
    brandGain: 35,
    growthBonus: 0.2,
    churnReduction: 0,
    moodBonus: 0,
  },
];

export function getCampaignDef(type: MarketingCampaignType): MarketingCampaignDef | undefined {
  return MARKETING_CAMPAIGNS.find(c => c.type === type);
}
