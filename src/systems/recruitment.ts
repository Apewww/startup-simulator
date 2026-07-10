import type { Applicant, ApplicantMood, EmployeeRole, Employee, SourcingCampaign } from '../types';

const ROLES: EmployeeRole[] = ['Developer', 'Designer', 'Lead_Developer', 'SysAdmin'];

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

function rollLevel(tier: SourcingCampaign['tier']): number {
  const r = Math.random();
  switch (tier) {
    case 'basic':
      return r < 0.8 ? 1 : 2;
    case 'pro':
      return r < 0.4 ? 1 : r < 0.85 ? 2 : 3;
    case 'headhunter':
      return r < 0.2 ? 1 : r < 0.5 ? 2 : 3;
  }
}

export function generateApplicant(campaign: SourcingCampaign): Applicant {
  const role = pick(ROLES);
  const level = rollLevel(campaign.tier);
  const speed = parseFloat((0.8 + Math.random() * 0.7).toFixed(2));

  let baseSalary: number;
  switch (role) {
    case 'Designer': baseSalary = 300 + level * 150; break;
    case 'SysAdmin': baseSalary = 350 + level * 150; break;
    case 'Developer': baseSalary = 400 + level * 200; break;
    case 'Lead_Developer': baseSalary = 600 + level * 250; break;
  }
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

export const CAMPAIGN_DAYS: Record<SourcingCampaign['tier'], number> = {
  basic: 10,
  pro: 5,
  headhunter: 2,
};

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

export function applicantToEmployee(applicant: Applicant): Employee {
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
  };
}
