export type MarketingCampaignType = 'social_media_blitz' | 'brand_awareness' | 'pr_campaign' | 'viral_marketing';

export interface MarketingCampaign {
  id: string;
  type: MarketingCampaignType;
  cost: number;
  durationTicks: number;
  ticksElapsed: number;
  brandGain: number;
  active: boolean;
}

export interface BrandMetrics {
  score: number;
}
