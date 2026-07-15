export type EventType = 'ddos' | 'traffic_spike' | 'server_outage' | 'pr_crisis' | 'viral_growth' | 'market_boom' | 'market_crash' | 'sector_gold_rush';

export type HotSector = 'social_media' | 'ecommerce' | 'search_engine' | null;

export interface EventEffects {
  rpsMultiplier?: number;
  userGrowthMultiplier?: number;
  revenueMultiplier?: number;
  crashChanceBonus?: number;
}

export interface GameEvent {
  id: string;
  type: EventType;
  name: string;
  description: string;
  duration: number;
  tickLeft: number;
  effects: EventEffects;
  hotSector?: HotSector;
}
