export type MonetizationStrategy = 'none' | 'text_ads' | 'video_ads' | 'targeted_ads' | 'freemium' | 'subscription';

export interface PricingTier {
  id: string;
  label: string;
  revenueMult: number;
  growthMult: number;
  moodTarget: number;
}

export interface BusinessLoan {
  id: string;
  principal: number;
  interestRate: number;
  monthlyPayment: number;
  totalMonths: number;
  monthsPaid: number;
  status: 'active' | 'paid' | 'defaulted';
}

export type PricingTiersMap = Record<string, PricingTier[]>;

export const PRICING_TIERS: PricingTiersMap = {
  social_media: [
    { id: 'sm_light', label: 'Light (non-intrusive)', revenueMult: 1.0, growthMult: 1.0, moodTarget: 85 },
    { id: 'sm_moderate', label: 'Moderate', revenueMult: 1.3, growthMult: 0.90, moodTarget: 75 },
    { id: 'sm_aggressive', label: 'Aggressive', revenueMult: 1.6, growthMult: 0.80, moodTarget: 65 },
    { id: 'sm_saturated', label: 'Saturated', revenueMult: 2.0, growthMult: 0.65, moodTarget: 50 },
  ],
  e_commerce: [
    { id: 'ec_1pct', label: '1% Fee', revenueMult: 1.0, growthMult: 1.0, moodTarget: 82 },
    { id: 'ec_2pct', label: '2% Fee', revenueMult: 1.8, growthMult: 0.90, moodTarget: 76 },
    { id: 'ec_3pct', label: '3% Fee', revenueMult: 2.5, growthMult: 0.78, moodTarget: 68 },
    { id: 'ec_5pct', label: '5% Fee', revenueMult: 3.5, growthMult: 0.55, moodTarget: 50 },
  ],
  search_engine: [
    { id: 'se_tier0', label: '$0.001/1k calls', revenueMult: 1.0, growthMult: 1.0, moodTarget: 84 },
    { id: 'se_tier1', label: '$0.005/1k calls', revenueMult: 2.5, growthMult: 0.85, moodTarget: 75 },
    { id: 'se_tier2', label: '$0.01/1k calls', revenueMult: 4.0, growthMult: 0.70, moodTarget: 62 },
    { id: 'se_tier3', label: '$0.02/1k calls', revenueMult: 6.0, growthMult: 0.45, moodTarget: 45 },
  ],
};

export function getPricingTiers(productId: string | null): PricingTier[] {
  if (!productId) return [];
  return PRICING_TIERS[productId] || [];
}

export function getPricingTier(tierId: string | null, productId: string | null): PricingTier | undefined {
  if (!tierId || !productId) return undefined;
  return PRICING_TIERS[productId]?.find(t => t.id === tierId);
}

export function getDefaultPricingTier(productId: string | null): string {
  if (!productId) return '';
  return PRICING_TIERS[productId]?.[0]?.id || '';
}
