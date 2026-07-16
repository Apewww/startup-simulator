export type CompetitorSector = 'social_media' | 'ecommerce' | 'search_engine';
export type CompetitorPersonality = 'aggressive' | 'conservative' | 'opportunistic';

export interface OwnershipStake {
  ownerId: string;
  percentage: number;
}

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
  hotSectorBadgeTicks: number;
  newBadgeTicks: number;
  userHistory: number[];   // last 3 months userCount for growthMomentum calc
  isUnicorn: boolean;      // high growth, high volatility
  totalShares: number;
  sharePrice: number;
  ownership: OwnershipStake[];
}

// Player's market presence (virtual entry for stock market)
export interface PlayerMarketEntry {
  id: 'player';
  name: string;
  sector: CompetitorSector;
  valuation: number;
  totalShares: number;
  sharePrice: number;
  ownership: OwnershipStake[];
}
