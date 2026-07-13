export interface PerkDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  cost: number;
  furnitureUnlock?: string;
}

export const PERKS: PerkDef[] = [
  {
    id: 'coffee_machine',
    name: 'Coffee Machine',
    description: 'Unlock Coffee Machine — reduces happiness decay while working by 50% (radius 2 tiles).',
    icon: 'Coffee',
    cost: 1,
    furnitureUnlock: 'coffee_machine',
  },
  {
    id: 'ergonomic_chair',
    name: 'Ergonomic Chair',
    description: 'Unlock Ergonomic Chair — raises overwork threshold from 50 to 80 ticks (per-tile).',
    icon: 'Armchair',
    cost: 1,
    furnitureUnlock: 'ergonomic_chair',
  },
  {
    id: 'water_dispenser',
    name: 'Water Dispenser',
    description: 'Unlock Water Dispenser — +0.2/tick happiness recovery while idle (radius 2 tiles).',
    icon: 'Droplets',
    cost: 1,
    furnitureUnlock: 'water_dispenser',
  },
  {
    id: 'sales_auto_renew',
    name: 'Auto-Renew Campaigns',
    description: 'Ad Monetization Specialist automatically renegotiates with past clients after campaign ends. Renewal at 70-90% of original deal value.',
    icon: 'RefreshCw',
    cost: 2,
  },
  {
    id: 'sales_dual_cap',
    name: 'Dual Campaigns',
    description: 'Increases active campaign limit per Ad Monetization Specialist from 1 to 2.',
    icon: 'Layers',
    cost: 2,
  },
  {
    id: 'hardware_overclock',
    name: 'Hardware Overclocking',
    description: 'Upgrade/downgrade node langsung di rack & inventory untuk hemat plot. Upgrade berbayar (skala harga node), downgrade tanpa refund.',
    icon: 'Gauge',
    cost: 10,
  },
];

export function getPerkDef(id: string): PerkDef | undefined {
  return PERKS.find((p) => p.id === id);
}
