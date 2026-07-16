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

export function ticksForLevel(baseTicks: number, level: number): number {
  return Math.round(baseTicks * (1 + (level - 1) * 0.5));
}

export function costForLevel(baseCost: number, level: number): number {
  return Math.round(baseCost * (0.5 + (level - 1) * 0.35));
}

export function minDevLevelForLevel(baseMinLevel: number, level: number): number {
  return baseMinLevel + level - 1;
}

export function startResearch(
  project: ResearchProjectDef,
  employeeId: string,
  targetLevel: number,
): ActiveResearch {
  return {
    id: nextId(),
    projectId: project.id,
    assignedEmployeeId: employeeId,
    progress: 0,
    maxProgress: ticksForLevel(project.baseTicks, targetLevel),
    monthlyCost: Math.round(costForLevel(project.cost, targetLevel) * 0.05),
    targetLevel,
  };
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

export function isResearchComplete(active: ActiveResearch): boolean {
  return active.progress >= active.maxProgress;
}

export function canStartLevel(
  project: ResearchProjectDef,
  targetLevel: number,
  unlockedTechs: string[],
  unlockedLevels: Record<string, number>,
  employees: Employee[],
): { ok: boolean; reason?: string } {
  const currentLevel = unlockedLevels[project.id] ?? 0;
  if (targetLevel <= currentLevel) return { ok: false, reason: 'Already unlocked' };
  if (targetLevel > project.maxLevel) return { ok: false, reason: 'Max level reached' };
  if (targetLevel > currentLevel + 1) return { ok: false, reason: `Must unlock Lv.${targetLevel - 1} first` };

  if (!project.prerequisites.every(p => unlockedTechs.includes(p))) {
    return { ok: false, reason: 'Prerequisites not met' };
  }

  const requiredDevLv = minDevLevelForLevel(project.minDeveloperLevel, targetLevel);
  const hasDev = employees.some(e =>
    e.role === 'Developer' && e.level >= requiredDevLv && !e.currentTask
  );
  if (!hasDev) {
    return { ok: false, reason: `Need an idle Developer Lv.${requiredDevLv}+` };
  }

  return { ok: true };
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

export function getResearchProgress(active: ActiveResearch): number {
  return active.maxProgress > 0 ? Math.round((active.progress / active.maxProgress) * 100) : 0;
}
