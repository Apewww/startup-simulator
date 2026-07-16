import type { BoardTarget, BoardMetric, TermSheet } from '../types/investorRelations';

const INVESTOR_NAMES = [
  'Sequoia Capital', 'Andreessen Horowitz', 'Accel Partners', 'Benchmark',
  'Index Ventures', 'Kleiner Perkins', 'Greylock Partners', 'Lightspeed Venture Partners',
  'Insight Partners', 'Tiger Global',
];

let termSheetCounter = 0;

function nextTermSheetId(): string {
  termSheetCounter += 1;
  return `ts-${termSheetCounter}`;
}

export function resetTermSheetCounter(): void {
  termSheetCounter = 0;
}

export function generateQuarterlyTargets(
  quarter: number,
  currentUsers: number,
  monthlyRevenue: number,
  brandScore: number,
  _cohesionScore: number,
  uptime: number,
): BoardTarget[] {
  const baseUsers = Math.max(100, currentUsers);
  const baseRevenue = Math.max(500, monthlyRevenue);
  return [
    {
      id: `qt-${quarter}-users`,
      quarter,
      metric: 'users',
      label: 'User Target',
      targetValue: Math.round(baseUsers * (1.3 + Math.random() * 0.2)),
      currentValue: currentUsers,
      reward: Math.round(baseUsers * 0.5),
      penalty: 5,
      met: false,
    },
    {
      id: `qt-${quarter}-revenue`,
      quarter,
      metric: 'revenue',
      label: 'Monthly Revenue',
      targetValue: Math.round(baseRevenue * (1.25 + Math.random() * 0.25)),
      currentValue: monthlyRevenue,
      reward: Math.round(baseRevenue * 2),
      penalty: 5,
      met: false,
    },
    {
      id: `qt-${quarter}-growth`,
      quarter,
      metric: 'growth_rate',
      label: 'Growth Rate',
      targetValue: Math.round((0.05 + Math.random() * 0.1) * 100) / 100,
      currentValue: 0,
      reward: Math.round(baseUsers * 0.3),
      penalty: 3,
      met: false,
    },
    {
      id: `qt-${quarter}-uptime`,
      quarter,
      metric: 'uptime',
      label: 'Uptime',
      targetValue: 98,
      currentValue: uptime,
      reward: Math.round(baseRevenue * 0.5),
      penalty: 3,
      met: false,
    },
    {
      id: `qt-${quarter}-brand`,
      quarter,
      metric: 'brand_score',
      label: 'Brand Score',
      targetValue: Math.min(100, Math.max(30, brandScore + 10 + Math.round(Math.random() * 15))),
      currentValue: brandScore,
      reward: Math.round(baseRevenue * 0.3),
      penalty: 2,
      met: false,
    },
  ];
}

export function evaluateQuarterlyTargets(
  targets: BoardTarget[],
  state: {
    currentUsers: number;
    monthlyRevenue: number;
    growthRate: number;
    uptime: number;
    brandScore: number;
    cohesionScore: number;
  },
): { targets: BoardTarget[]; satisfactionDelta: number; totalReward: number } {
  let satisfactionDelta = 0;
  let totalReward = 0;

  const currentValues: Record<BoardMetric, number> = {
    users: state.currentUsers,
    revenue: state.monthlyRevenue,
    growth_rate: state.growthRate,
    uptime: state.uptime,
    brand_score: state.brandScore,
    cohesion: state.cohesionScore,
  };

  const updatedTargets = targets.map(t => {
    const current = currentValues[t.metric];
    const met = current >= t.targetValue;
    if (met) {
      satisfactionDelta += 0;
      totalReward += t.reward;
    } else {
      satisfactionDelta -= t.penalty;
    }
    return { ...t, currentValue: current, met };
  });

  return { targets: updatedTargets, satisfactionDelta, totalReward };
}

export function generateTermSheet(
  month: number,
  currentUsers: number,
  monthlyRevenue: number,
  _boardSatisfaction: number,
  totalEquityGiven: number,
): TermSheet | null {
  if (totalEquityGiven >= 60) return null;

  const valuation = Math.max(10000, currentUsers * 80 + monthlyRevenue * 12);
  const baseAmount = Math.round(valuation * (0.05 + Math.random() * 0.1));
  const amount = baseAmount;
  const equityGiven = Math.round((amount / valuation) * 100 * 10) / 10;
  const remainingEquity = 100 - totalEquityGiven;
  const cappedEquity = Math.min(equityGiven, remainingEquity * 0.5, 25);

  if (cappedEquity < 2) return null;

  const personalities: TermSheet['investorPersonality'][] = ['hands_on', 'passive', 'strategic'];
  const personality = personalities[Math.floor(Math.random() * personalities.length)];
  const boardSeats = cappedEquity >= 20 ? 2 : cappedEquity >= 10 ? 1 : 0;
  const vetoRights = cappedEquity >= 15 && Math.random() > 0.5;

  const nameIdx = Math.floor(Math.random() * INVESTOR_NAMES.length);

  return {
    id: nextTermSheetId(),
    amount,
    equityGiven: Math.round(cappedEquity * 10) / 10,
    boardSeats,
    vestingMonths: 24 + Math.floor(Math.random() * 12),
    vetoRights,
    investorName: INVESTOR_NAMES[nameIdx],
    expiresAtMonth: month + 3,
    investorPersonality: personality,
  };
}

export function calcBoardSatisfaction(
  currentUsers: number,
  monthlyRevenue: number,
  growthRate: number,
  uptime: number,
  brandScore: number,
  cohesionScore: number,
): number {
  const userScore = Math.min(100, (currentUsers / 100000) * 100);
  const revenueScore = Math.min(100, (monthlyRevenue / 50000) * 100);
  const growthScore = Math.min(100, (Math.max(0, growthRate) / 0.2) * 100);
  const uptimeScore = uptime;
  const brandScoreVal = brandScore;
  const cohesionScoreVal = Math.min(100, cohesionScore * 100);

  let total = 0;
  total += userScore * 0.3;
  total += revenueScore * 0.25;
  total += growthScore * 0.2;
  total += uptimeScore * 0.1;
  total += brandScoreVal * 0.1;
  total += cohesionScoreVal * 0.05;

  return Math.round(total);
}
