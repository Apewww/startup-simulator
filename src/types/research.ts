export type ResearchCategory = 'infrastructure' | 'platform' | 'monetization' | 'ai_data';

export interface ResearchEffect {
  type: 'feature_unlock' | 'traffic_mult' | 'cost_reduction' | 'revenue_mult' | 'cohesion_bonus' | 'brand_mult' | 'churn_reduction' | 'server_efficiency' | 'dev_speed_mult';
  target?: string;
  value: number;
}

export interface ResearchProjectDef {
  id: string;
  name: string;
  description: string;
  category: ResearchCategory;
  tier: number;
  baseTicks: number;
  minDeveloperLevel: number;
  prerequisites: string[];
  effects: ResearchEffect[];
  cost: number;
  maxLevel: number;
}

export interface ActiveResearch {
  id: string;
  projectId: string;
  assignedEmployeeId: string;
  progress: number;
  maxProgress: number;
  monthlyCost: number;
  currentLevel: number;
}

export interface UnlockedTech {
  id: string;
  unlockedAtMonth: number;
  level: number;
}
