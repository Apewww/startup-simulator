import type { AchievementDef } from '../types/wealth';

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'hustler', label: 'Hustler', icon: '💼', requirement: 100_000, description: 'Withdraw $100,000 in personal funds from your company.' },
  { id: 'founder', label: 'Founder', icon: '🏗️', requirement: 500_000, description: 'Withdraw $500,000 in personal funds from your company.' },
  { id: 'tycoon', label: 'Tycoon', icon: '💰', requirement: 1_000_000, description: 'Build personal wealth of $1,000,000.' },
  { id: 'mogul', label: 'Mogul', icon: '👑', requirement: 5_000_000, description: 'Build personal wealth of $5,000,000.' },
  { id: 'millionaire', label: 'Millionaire', icon: '💎', requirement: 10_000_000, description: 'Build personal wealth of $10,000,000.' },
  { id: 'multi_millionaire', label: 'Multi-Millionaire', icon: '🔷', requirement: 100_000_000, description: 'Build personal wealth of $100,000,000.' },
  { id: 'billionaire', label: 'Billionaire', icon: '🌟', requirement: 1_000_000_000, description: 'Achieve billionaire status — personal wealth of $1,000,000,000.' },
];

export function getAchievement(id: string): AchievementDef | undefined {
  return ACHIEVEMENTS.find(a => a.id === id);
}

export function checkNewAchievements(
  personalCash: number,
  unlockedTitles: string[],
): AchievementDef[] {
  return ACHIEVEMENTS.filter(
    a => personalCash >= a.requirement && !unlockedTitles.includes(a.id)
  );
}
