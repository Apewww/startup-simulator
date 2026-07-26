import type { PlatformFeature, AdLead, AdCampaign, MarketingCampaign, MonetizationStrategy, CompetitorSector } from './index';

export interface ProductPortfolioState {
  id: string;
  name: string;
  sector: CompetitorSector;
  features: PlatformFeature[];
  currentUsers: number;
  userMood: number;
  activeMonetization: MonetizationStrategy;
  activePricingTier: string;
  brandScore: number;
  marketingCampaigns: MarketingCampaign[];
  adLeads: AdLead[];
  adCampaigns: AdCampaign[];
  adSalesUnlockNotified: boolean;
  campaignCostThisMonth: number;
  createdMonth: number;
  expandedRegions: string[];
  businessModel: 'b2c' | 'b2b';
}

export function createProductState(id: string, name: string, sector: CompetitorSector, features: PlatformFeature[], month: number, pricingTier: string): ProductPortfolioState {
  return {
    id,
    name,
    sector,
    features,
    currentUsers: 0,
    userMood: 80,
    activeMonetization: 'none' as MonetizationStrategy,
    activePricingTier: pricingTier,
    brandScore: 10,
    marketingCampaigns: [],
    adLeads: [],
    adCampaigns: [],
    adSalesUnlockNotified: false,
    campaignCostThisMonth: 0,
    createdMonth: month,
    expandedRegions: [],
    businessModel: sector === 'search_engine' ? 'b2b' : 'b2c',
  };
}
