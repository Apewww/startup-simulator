import type { Employee, PlacedFurniture } from '../types';
import { FURNITURE } from '../data/furniture';

export interface FurnitureEffects {
  coffee: Set<string>;
  water: Set<string>;
  chair: Set<string>;
}

export function computeFurnitureEffects(
  furniture: PlacedFurniture[],
  employees: Employee[],
): FurnitureEffects {
  const coffee = new Set<string>();
  const water = new Set<string>();
  const chair = new Set<string>();

  for (const furn of furniture) {
    if (furn.defId === 'ergonomic_chair') {
      const seated = employees.find(e => e.gridX === furn.gridX && e.gridY === furn.gridY);
      if (seated) chair.add(seated.id);
      continue;
    }

    const def = FURNITURE_BY_ID[furn.defId];
    const target = def?.effect === 'coffee_decay' ? coffee
      : def?.effect === 'water_recovery' ? water : null;
    if (!target) continue;

    for (const emp of employees) {
      // Horizontal band: furniture's own row + the row directly below it (2 rows).
      if (emp.gridY === furn.gridY || emp.gridY === furn.gridY + 1) target.add(emp.id);
    }
  }

  return { coffee, water, chair };
}

const FURNITURE_BY_ID: Record<string, (typeof FURNITURE)[number]> = Object.fromEntries(
  FURNITURE.map((f) => [f.id, f]),
);
