import { ACHIEVEMENTS } from '../data/achievements';
import type { AchievementDef } from '../types/wealth';

export function calcMaxWithdrawal(
  companyCash: number,
  playerOwnershipPct: number,
): number {
  return Math.floor(companyCash * (Math.max(0, playerOwnershipPct) / 100));
}

export function calcPlayerOwnership(totalEquityGiven: number): number {
  return Math.max(20, 100 - totalEquityGiven);
}

export function getCurrentTitle(
  personalCash: number,
  unlockedTitles: string[],
): { id: string; label: string; icon: string } | null {
  let best: AchievementDef | null = null;
  for (const t of ACHIEVEMENTS) {
    if (unlockedTitles.includes(t.id) && personalCash >= t.requirement) {
      best = t;
    }
  }
  return best ? { id: best.id, label: best.label, icon: best.icon } : null;
}

export function getNextAchievement(
  personalCash: number,
  unlockedTitles: string[],
): AchievementDef | null {
  for (const a of ACHIEVEMENTS) {
    if (!unlockedTitles.includes(a.id) && personalCash < a.requirement) {
      return a;
    }
  }
  return null;
}

export function calcNextAchievementProgress(personalCash: number, unlockedTitles: string[]): number {
  for (const a of ACHIEVEMENTS) {
    if (!unlockedTitles.includes(a.id)) {
      return Math.min(100, Math.round((personalCash / a.requirement) * 100));
    }
  }
  return 100;
}
