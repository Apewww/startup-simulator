import type { BusinessLoan } from '../types/monetization';

export function calcCompanyValuation(currentUsers: number, totalRevenueLastMonth: number): number {
  return currentUsers * 10 + totalRevenueLastMonth * 12 * 2;
}

export function calcMaxLoan(companyValuation: number, creditScore: number): number {
  const base = Math.max(5000, companyValuation * 0.3);
  return creditScore < 30 ? Math.round(base * 0.5) : Math.round(base);
}

export function calcInterestRate(tenor: number, creditScore: number): number {
  let rate = 0.08;
  if (tenor === 12) rate = 0.10;
  else if (tenor === 24) rate = 0.12;
  if (creditScore > 80) rate -= 0.02;
  return rate;
}

export function calcMonthlyPayment(principal: number, interestRate: number, tenor: number): number {
  return Math.round(principal * (1 + interestRate) / tenor);
}

export function updateCreditScore(current: number, event: 'on_time' | 'early' | 'late' | 'default'): number {
  switch (event) {
    case 'on_time': return Math.min(100, current + 5);
    case 'early': return Math.min(100, current + 10);
    case 'late': return Math.max(0, current - 10);
    case 'default': return Math.max(0, current - 30);
  }
}

export function makeLoan(amount: number, tenor: number, creditScore: number, existingLoan: BusinessLoan | null): { loan: BusinessLoan; error?: string } {
  if (existingLoan?.status === 'active') {
    return { loan: existingLoan, error: 'Already have an active loan' };
  }
  const interestRate = calcInterestRate(tenor, creditScore);
  const monthlyPayment = calcMonthlyPayment(amount, interestRate, tenor);
  const loan: BusinessLoan = {
    id: `loan-${Date.now().toString(36)}`,
    principal: amount,
    interestRate,
    monthlyPayment,
    totalMonths: tenor,
    monthsPaid: 0,
    status: 'active',
  };
  return { loan };
}
