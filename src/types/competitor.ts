export type CompetitorSector = 'social_media' | 'ecommerce' | 'search_engine';
export type CompetitorPersonality = 'aggressive' | 'conservative' | 'opportunistic';

export interface CompetitorProduct {
  id: string;
  name: string;
  sector: CompetitorSector;
  valuation: number;
  growthRate: number;
  volatility: number;
  personality: CompetitorPersonality;
  rank: number;
  delisted: boolean;
  delistedAtMonth: number;
  createdAtMonth: number;
  userCount: number;
  monthlyRevenue: number;
}
