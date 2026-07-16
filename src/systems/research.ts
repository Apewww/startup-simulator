import type { ActiveResearch, ResearchProjectDef, ResearchEffect } from '../types/research';
import type { Employee } from '../types';

let researchIdCounter = 0;

export function resetResearchIdCounter(): void {
  researchIdCounter = 0;
}

function nextId(): string {
  researchIdCounter += 1;
  return `rs-${researchIdCounter}`;
}

export function startResearch(
  project: ResearchProjectDef,
  employeeId: string,
): ActiveResearch {
  return {
    id: nextId(),
    projectId: project.id,
    assignedEmployeeId: employeeId,
    progress: 0,
    maxProgress: ticksForLevel(project.baseTicks, 1),
    monthlyCost: project.cost * 0.05,
    currentLevel: 1,
  };
}

export function ticksForLevel(baseTicks: number, level: number): number {
  return Math.round(baseTicks * (1 + (level - 1) * 0.5));
}

export function processResearchTick(
  active: ActiveResearch,
  employee: Employee,
  unlockedTechs: string[],
  researchDefs: ResearchProjectDef[],
): ActiveResearch | null {
  const def = researchDefs.find(r => r.id === active.projectId);
  if (!def) return null;
  if (active.progress >= active.maxProgress) return active;

  const hasDevSpeedBonus = unlockedTechs.some(t => {
    const d = researchDefs.find(r => r.id === t);
    return d?.effects.some(e => e.type === 'dev_speed_mult');
  });
  const devSpeedMult = hasDevSpeedBonus ? 0.1 : 0;
  const speed = employee.speed * (1 + devSpeedMult);
  const newProgress = Math.min(active.progress + speed, active.maxProgress);

  return { ...active, progress: newProgress };
}

export function isLevelComplete(active: ActiveResearch): boolean {
  return active.progress >= active.maxProgress;
}

export function levelUp(active: ActiveResearch, def: ResearchProjectDef): ActiveResearch | null {
  const nextLevel = active.currentLevel + 1;
  if (nextLevel > def.maxLevel) {
    return { ...active, currentLevel: def.maxLevel, progress: active.maxProgress };
  }
  return {
    ...active,
    currentLevel: nextLevel,
    progress: 0,
    maxProgress: ticksForLevel(def.baseTicks, nextLevel),
  };
}

export function isResearchFullyComplete(active: ActiveResearch, def: ResearchProjectDef): boolean {
  return active.currentLevel >= def.maxLevel && active.progress >= active.maxProgress;
}

export function calcPartialEffectValue(fullValue: number, level: number, maxLevel: number): number {
  return (fullValue / maxLevel) * level;
}

export function collectResearchEffects(
  unlockedTechs: string[],
  allProjects: ResearchProjectDef[],
  unlockedLevels: Record<string, number>,
): ResearchEffect[] {
  const effects: ResearchEffect[] = [];
  for (const techId of unlockedTechs) {
    const def = allProjects.find(r => r.id === techId);
    if (def) {
      const level = unlockedLevels[techId] ?? def.maxLevel;
      for (const e of def.effects) {
        const partialVal = calcPartialEffectValue(e.value, level, def.maxLevel);
        effects.push({ ...e, value: partialVal });
      }
    }
  }
  return effects;
}

export function calcResearchEffects(
  effects: ResearchEffect[],
  type: ResearchEffect['type'],
  target?: string,
): number {
  return effects
    .filter(e => e.type === type && (!target || e.target === target))
    .reduce((sum, e) => sum + e.value, 0);
}

export function getActiveResearchMonthlyCost(active: ActiveResearch | null): number {
  if (!active) return 0;
  return active.monthlyCost;
}
