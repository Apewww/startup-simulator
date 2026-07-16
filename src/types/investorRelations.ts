export type BoardMetric = 'users' | 'revenue' | 'growth_rate' | 'uptime' | 'brand_score' | 'cohesion';

export interface BoardTarget {
  id: string;
  quarter: number;
  metric: BoardMetric;
  label: string;
  targetValue: number;
  currentValue: number;
  reward: number;
  penalty: number;
  met: boolean;
}

export interface QuarterlyReport {
  quarter: number;
  month: number;
  targets: BoardTarget[];
  satisfactionDelta: number;
  bonusCash: number;
}

export interface TermSheet {
  id: string;
  amount: number;
  equityGiven: number;
  boardSeats: number;
  vestingMonths: number;
  vetoRights: boolean;
  investorName: string;
  expiresAtMonth: number;
  investorPersonality: 'hands_on' | 'passive' | 'strategic';
}

export interface AiFundingOffer {
  id: string;
  aiId: string;
  aiName: string;
  amount: number;
  equityGiven: number;
}
