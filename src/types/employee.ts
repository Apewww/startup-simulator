export type EmployeeRole = 'Developer' | 'Designer' | 'Lead_Developer' | 'SysAdmin';

export interface SourcingCampaign {
  tier: 'basic' | 'pro' | 'headhunter';
  daysLeft: number;
}

export type ApplicantMood = 'patient' | 'stubborn' | 'volatile';

export interface Applicant {
  id: string;
  name: string;
  role: EmployeeRole;
  level: number;
  speed: number;
  expectedSalary: number;
  minAcceptableSalary: number;
  mood: ApplicantMood;
  negotiationRounds: number;
  status: 'pending' | 'countered' | 'rejected' | 'hired';
}

export interface Employee {
  id: string;
  name: string;
  role: EmployeeRole;
  level: number;
  salary: number;
  happiness: number;
  speed: number;
  currentTask: string | null;
  taskProgress: number;
  resignTicks: number;
  deskIndex: number;
}

export interface FundingRound {
  id: string;
  round: number;
  amount: number;
  equityGiven: number;
  accepted: boolean;
  month: number;
}

export function calcSysAdminEffect(level: number): { recoveryBonus: number; crashReduction: number } {
  return {
    recoveryBonus: 1 + level * 0.5,
    crashReduction: 1 - level * 0.08,
  };
}

export function calcFundingOffer(month: number, users: number, revenue: number): { amount: number; equity: number } | null {
  const score = users * 0.1 + revenue * 0.05 + month * 20;
  if (score < 500) return null;
  const amount = Math.round(score * 12);
  const equity = Math.max(5, Math.min(40, Math.round(40 - score / 200)));
  return { amount, equity };
}
