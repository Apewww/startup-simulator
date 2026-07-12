import type { Employee } from '../types/employee';

export function getSupervisionBoost(lead: Employee, supervisedCount = 1): number {
  const base = lead.speed * 0.1;
  const factor = 1 - Math.min(0.5, Math.max(0, supervisedCount - 1) * 0.05);
  return base * factor;
}
