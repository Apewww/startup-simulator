import type { AchievementDef } from '../types/wealth';

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'hustler', label: 'Hustler', icon: '💼', requirement: 100_000 },
  { id: 'founder', label: 'Founder', icon: '🏗️', requirement: 500_000 },
  { id: 'tycoon', label: 'Tycoon', icon: '💰', requirement: 1_000_000 },
  { id: 'mogul', label: 'Mogul', icon: '👑', requirement: 5_000_000 },
  { id: 'millionaire', label: 'Millionaire', icon: '💎', requirement: 10_000_000 },
  { id: 'multi_millionaire', label: 'Multi-Millionaire', icon: '🔷', requirement: 100_000_000 },
  { id: 'billionaire', label: 'Billionaire', icon: '🌟', requirement: 1_000_000_000 },
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
