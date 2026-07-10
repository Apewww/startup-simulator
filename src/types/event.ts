export type EventType = 'ddos' | 'traffic_spike' | 'server_outage' | 'pr_crisis' | 'viral_growth';

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
}
