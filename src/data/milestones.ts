import type { Employee, PlatformFeature, ServerRack } from '../types';

export interface PerkContext {
  employees: Employee[];
  cash: number;
  currentUsers: number;
  features: PlatformFeature[];
  racks: ServerRack[];
  month: number;
}

export interface MilestoneDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  repeatable: boolean;
  check: (ctx: PerkContext) => boolean;
  getProgress?: (ctx: PerkContext) => { current: number; target: number };
  repeatCount?: (ctx: PerkContext) => number;
}

export const MILESTONES: MilestoneDef[] = [
  {
    id: 'emp_5',
    name: 'Small Team',
    description: 'Hire 5 employees',
    icon: 'Users',
    repeatable: false,
    check: (ctx) => ctx.employees.length >= 5,
    getProgress: (ctx) => ({ current: ctx.employees.length, target: 5 }),
  },
  {
    id: 'emp_10',
    name: 'Growing Team',
    description: 'Hire 10 employees',
    icon: 'Users',
    repeatable: false,
    check: (ctx) => ctx.employees.length >= 10,
    getProgress: (ctx) => ({ current: ctx.employees.length, target: 10 }),
  },
  {
    id: 'emp_20',
    name: 'Large Team',
    description: 'Hire 20 employees',
    icon: 'Users',
    repeatable: false,
    check: (ctx) => ctx.employees.length >= 20,
    getProgress: (ctx) => ({ current: ctx.employees.length, target: 20 }),
  },
  {
    id: 'cash_50k',
    name: 'Profitable',
    description: 'Reach $50,000 cash',
    icon: 'DollarSign',
    repeatable: false,
    check: (ctx) => ctx.cash >= 50000,
    getProgress: (ctx) => ({ current: Math.floor(ctx.cash), target: 50000 }),
  },
  {
    id: 'cash_500k',
    name: 'Wealthy',
    description: 'Reach $500,000 cash',
    icon: 'DollarSign',
    repeatable: false,
    check: (ctx) => ctx.cash >= 500000,
    getProgress: (ctx) => ({ current: Math.floor(ctx.cash), target: 500000 }),
  },
  {
    id: 'users_1k',
    name: 'Getting Traction',
    description: 'Reach 1,000 users',
    icon: 'TrendingUp',
    repeatable: false,
    check: (ctx) => ctx.currentUsers >= 1000,
    getProgress: (ctx) => ({ current: Math.floor(ctx.currentUsers), target: 1000 }),
  },
  {
    id: 'users_10k',
    name: 'Popular',
    description: 'Reach 10,000 users',
    icon: 'TrendingUp',
    repeatable: false,
    check: (ctx) => ctx.currentUsers >= 10000,
    getProgress: (ctx) => ({ current: Math.floor(ctx.currentUsers), target: 10000 }),
  },
  {
    id: 'features_5',
    name: 'Feature Rich',
    description: 'Build 5 platform features',
    icon: 'LayoutGrid',
    repeatable: false,
    check: (ctx) => ctx.features.length >= 5,
    getProgress: (ctx) => ({ current: ctx.features.length, target: 5 }),
  },
  {
    id: 'features_all_lv3',
    name: 'Polished Product',
    description: 'Upgrade all features to Lv.3+',
    icon: 'LayoutGrid',
    repeatable: false,
    check: (ctx) => ctx.features.length > 0 && ctx.features.every((f) => f.level >= 3),
  },
  {
    id: 'first_rack',
    name: 'Server Infrastructure',
    description: 'Set up your first server rack',
    icon: 'Server',
    repeatable: false,
    check: (ctx) => ctx.racks.length >= 1,
  },
  {
    id: 'survival_6mo',
    name: 'Long-Term Survivor',
    description: 'Earn +1 Perk Point for every 6 months survived',
    icon: 'Clock',
    repeatable: true,
    check: () => false,
    repeatCount: (ctx) => Math.floor(ctx.month / 6),
  },
];

export function getMilestoneDef(id: string): MilestoneDef | undefined {
  return MILESTONES.find((m) => m.id === id);
}
