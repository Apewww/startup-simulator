import type { Applicant, ApplicantMood, EmployeeRole, Employee, SourcingCampaign } from '../types';

export const ALL_ROLES: EmployeeRole[] = ['Developer', 'Designer', 'Lead_Developer', 'SysAdmin', 'HR', 'Ad_Monetization_Specialist'];

const FIRST_NAMES = [
  'Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry',
  'Ivy', 'Jack', 'Kevin', 'Luna', 'Mallory', 'Nina', 'Oscar', 'Peggy',
  'Quinn', 'Ray', 'Sam', 'Tina', 'Uma', 'Victor', 'Wendy', 'Xander',
  'Yara', 'Zane', 'Aria', 'Blake', 'Cora', 'Drew',
];

const LAST_NAMES = [
  'Chen', 'Patel', 'Kim', 'Singh', 'Brown', 'Lee', 'Garcia', 'Wilson',
  'Wang', 'Anderson', 'Taylor', 'Thomas', 'Hernandez', 'Moore', 'Martin',
  'Jackson', 'White', 'Harris', 'Clark', 'Lewis',
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateName(): string {
  return `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
}

function rollLevelHR(tier: SourcingCampaign['tier'], hrLevel: number): number {
  const boost = Math.min(hrLevel * 0.08, 0.24);
  const r = Math.random();
  switch (tier) {
    case 'basic':
      return r < 0.85 ? 1 : r < 0.97 ? 2 : 3;
    case 'pro':
      return r < 0.55 - boost ? 1 : r < 0.88 - boost ? 2 : 3;
    case 'headhunter':
      return r < 0.25 - boost ? 1 : r < 0.55 - boost ? 2 : 3;
  }
}

export function generateApplicant(campaign: SourcingCampaign, hrLevel: number = 0, availableRoles?: EmployeeRole[]): Applicant {
  const role = pick(availableRoles ?? ALL_ROLES);
  const level = rollLevelHR(campaign.tier, hrLevel);
  const speed = parseFloat((0.8 + Math.random() * 0.7).toFixed(2));

  let baseSalary = 300 + level * 150;
  if (role === 'Developer') baseSalary = 400 + level * 200;
  else if (role === 'Lead_Developer') baseSalary = 600 + level * 250;
  else if (role === 'SysAdmin') baseSalary = 350 + level * 150;
  else if (role === 'HR') baseSalary = 250 + level * 120;
  else if (role === 'Ad_Monetization_Specialist') baseSalary = 300 + level * 180;
  const expectedSalary = Math.round(baseSalary * (0.85 + speed * 0.15));

  const mood = pick(['patient', 'stubborn', 'volatile'] as const);
  const minRatios: Record<string, number> = { patient: 0.8, stubborn: 0.9, volatile: 0.85 };
  const minAcceptableSalary = Math.round(expectedSalary * minRatios[mood]);

  return {
    id: `app-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: generateName(),
    role,
    level,
    speed,
    expectedSalary,
    minAcceptableSalary,
    mood,
    negotiationRounds: 0,
    status: 'pending',
  };
}

export const CAMPAIGN_COST: Record<SourcingCampaign['tier'], number> = {
  basic: 0,
  pro: 200,
  headhunter: 1000,
};

export const CAMPAIGN_TICKS: Record<SourcingCampaign['tier'], number> = {
  basic: 200,
  pro: 100,
  headhunter: 40,
};

export function getCampaignTicks(tier: SourcingCampaign['tier'], hrLevel: number, hrSpeed: number): number {
  const base = CAMPAIGN_TICKS[tier];
  const reduction = hrLevel * 30 + Math.floor(hrSpeed * 10);
  return Math.max(20, base - reduction);
}

const MAX_ROUNDS: Record<ApplicantMood, number> = {
  patient: 4,
  stubborn: 2,
  volatile: 1,
};

const REJECT_CHANCE_BELOW_MIN: Record<ApplicantMood, number> = {
  patient: 0,
  stubborn: 0.4,
  volatile: 0.7,
};

export interface NegotiationResult {
  status: 'hired' | 'rejected' | 'countered';
  message: string;
  newExpectedSalary?: number;
}

export function negotiate(applicant: Applicant, offer: number): NegotiationResult {
  if (applicant.negotiationRounds >= MAX_ROUNDS[applicant.mood]) {
    return { status: 'rejected', message: 'Tired of negotiating. Goodbye.' };
  }

  if (offer >= applicant.expectedSalary) {
    return { status: 'hired', message: 'Deal! When do I start?' };
  }

  if (offer < applicant.minAcceptableSalary) {
    const rejectChance = REJECT_CHANCE_BELOW_MIN[applicant.mood];
    if (Math.random() < rejectChance) {
      return { status: 'rejected', message: 'That\'s insulting. I\'m out.' };
    }
    return { status: 'countered', message: 'Too low. My price stands.', newExpectedSalary: applicant.expectedSalary };
  }

  // Offer between min and expected → counter offer
  let reduction: number;
  switch (applicant.mood) {
    case 'patient': reduction = 0.15; break;
    case 'stubborn': reduction = 0.05; break;
    case 'volatile': reduction = 0.08; break;
  }
  const newSalary = Math.round(applicant.expectedSalary * (1 - reduction));
  const clamped = Math.max(newSalary, applicant.minAcceptableSalary);

  if (clamped === applicant.minAcceptableSalary) {
    return { status: 'hired', message: 'Fine, you win. I accept.', newExpectedSalary: clamped };
  }
  const moodMessages: Record<ApplicantMood, string> = {
    patient: 'How about we meet in the middle?',
    stubborn: 'I can come down a little. That\'s my final.',
    volatile: 'Fine... I\'ll lower it a bit.',
  };
  return { status: 'countered', message: moodMessages[applicant.mood], newExpectedSalary: clamped };
}

let empCounter = 0;

export function applicantToEmployee(applicant: Applicant, gridX: number, gridY: number): Employee {
  empCounter++;
  return {
    id: `emp-hired-${Date.now()}-${empCounter}`,
    name: applicant.name,
    role: applicant.role,
    level: applicant.level,
    salary: applicant.expectedSalary,
    happiness: 80,
    speed: applicant.speed,
    currentTask: null,
    taskProgress: 0,
    resignTicks: 0,
    gridX,
    gridY,
    isPlayer: false,
    isTraining: false,
    trainingProgress: 0,
    overworkTicks: 0,
    onVacation: false,
    vacationTicksLeft: 0,
    failStreak: 0,
  };
}
