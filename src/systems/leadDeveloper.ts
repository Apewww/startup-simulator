import type { Employee } from '../types/employee';

export function getSupervisionBoost(lead: Employee): number {
  return lead.speed * 0.1;
}
