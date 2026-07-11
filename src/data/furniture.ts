export type FurnitureEffect = 'coffee_decay' | 'ergonomic_overwork' | 'water_recovery';
export type FurniturePlacement = 'tile' | 'desk';

export interface FurnitureDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  price: number;
  unlockPerk: string;
  effect: FurnitureEffect;
  radius: number;
  placement: FurniturePlacement;
}

export interface PlacedFurniture {
  id: string;
  defId: string;
  gridX: number;
  gridY: number;
}

export const FURNITURE: FurnitureDef[] = [
  {
    id: 'coffee_machine',
    name: 'Coffee Machine',
    description: 'Reduces happiness decay while working by 50% for employees within 2 tiles.',
    icon: 'Coffee',
    price: 300,
    unlockPerk: 'coffee_machine',
    effect: 'coffee_decay',
    radius: 2,
    placement: 'tile',
  },
  {
    id: 'ergonomic_chair',
    name: 'Ergonomic Chair',
    description: 'Raises overwork threshold from 50 to 80 ticks. Place on an employee desk.',
    icon: 'Armchair',
    price: 150,
    unlockPerk: 'ergonomic_chair',
    effect: 'ergonomic_overwork',
    radius: 0,
    placement: 'desk',
  },
  {
    id: 'water_dispenser',
    name: 'Water Dispenser',
    description: 'Restores +0.2 happiness per tick while idle for employees within 2 tiles.',
    icon: 'Droplets',
    price: 250,
    unlockPerk: 'water_dispenser',
    effect: 'water_recovery',
    radius: 2,
    placement: 'tile',
  },
];

export function getFurnitureDef(id: string): FurnitureDef | undefined {
  return FURNITURE.find((f) => f.id === id);
}
