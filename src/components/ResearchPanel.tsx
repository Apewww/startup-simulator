import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { RESEARCH_TREE } from '../data/research';
import { canStartLevel, costForLevel, ticksForLevel, minDevLevelForLevel } from '../systems/research';
import { Microscope, CheckCircle, Clock, ArrowUp, XCircle } from 'lucide-react';

const CATEGORY_LABELS: Record<string, string> = {
  infrastructure: 'Infrastructure',
  platform: 'Platform',
  monetization: 'Monetization',
  ai_data: 'AI & Data',
};

const CATEGORY_COLORS: Record<string, string> = {
  infrastructure: '#4F5EFF',
  platform: '#17A366',
  monetization: '#B7791F',
  ai_data: '#D1453B',
};

function fmtTicks(n: number): string {
  if (n >= 600) return `${(n / 600).toFixed(1)}mo`;
  return `${n}t`;
}

export function ResearchPanel() {
  const employees = useGameStore((s) => s.employees);
  const unlockedTechs = useGameStore((s) => s.unlockedTechs);
  const unlockedLevels = useGameStore((s) => s.unlockedLevels);
  const activeResearch = useGameStore((s) => s.activeResearch);
  const startResearch = useGameStore((s) => s.startResearch);
  const cancelResearch = useGameStore((s) => s.cancelResearch);
  const cash = useGameStore((s) => s.cash);

  const developers = employees.filter(e => e.role === 'Developer' && !e.currentTask);
  const activeProject = activeResearch ? RESEARCH_TREE.find(r => r.id === activeResearch.projectId) : null;
  const progressPct = activeResearch ? Math.round((activeResearch.progress / activeResearch.maxProgress) * 100) : 0;

  const [filterCat, setFilterCat] = useState<string | 'all'>('all');
  const visible = filterCat === 'all' ? RESEARCH_TREE : RESEARCH_TREE.filter(r => r.category === filterCat);

  function handleResearch(projectId: string, targetLevel: number) {
    const project = RESEARCH_TREE.find(r => r.id === projectId);
    if (!project) return;
    const requiredDevLv = minDevLevelForLevel(project.minDeveloperLevel, targetLevel);
    const dev = employees.find(e => e.role === 'Developer' && e.level >= requiredDevLv && !e.currentTask);
    if (dev) startResearch(projectId, dev.id, targetLevel);
  }

  return (
    <div className="space-y-2 text-[11px]">
      {/* Active research */}
      {activeResearch && activeProject && (
        <div className="bg-indigo-soft/60 border border-indigo/20 rounded-lg p-2.5 space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Microscope className="w-3.5 h-3.5 text-indigo" />
              <span className="font-semibold text-indigo text-xs">{activeProject.name}</span>
            </div>
            <button onClick={cancelResearch} className="text-red hover:text-red/80 cursor-pointer" title="Cancel research">
              <XCircle className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-ink-soft mb-1">
            <span className="font-semibold text-indigo">Lv.{activeResearch.targetLevel}/{activeProject.maxLevel}</span>
            <span className="text-[9px]">{fmtTicks(activeResearch.maxProgress)} per level</span>
          </div>
          <div className="w-full h-1.5 bg-surface-2 rounded-full overflow-hidden">
            <div className="h-full bg-indigo rounded-full transition-all duration-300" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="flex justify-between text-[10px] text-ink-soft">
            <span>{Math.floor(activeResearch.progress)} / {activeResearch.maxProgress} ticks</span>
            <span>{progressPct}%</span>
          </div>
        </div>
      )}

      {/* Category filter */}
      <div className="flex gap-1 flex-wrap">
        <button onClick={() => setFilterCat('all')}
          className={`px-2 py-1 rounded-md text-[10px] font-semibold transition-colors cursor-pointer ${filterCat === 'all' ? 'bg-indigo text-white' : 'bg-surface-2 text-ink-soft hover:text-ink'}`}>
          All
        </button>
        {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
          <button key={key} onClick={() => setFilterCat(key)}
            className={`px-2 py-1 rounded-md text-[10px] font-semibold transition-colors cursor-pointer ${filterCat === key ? 'text-white' : 'bg-surface-2 text-ink-soft hover:text-ink'}`}
            style={filterCat === key ? { backgroundColor: CATEGORY_COLORS[key] } : {}}>
            {label}
          </button>
        ))}
      </div>

      {/* Research tree */}
      <div className="space-y-1 max-h-[300px] overflow-y-auto">
        {visible.length === 0 && (
          <div className="text-center py-4 text-ink-soft border border-dashed border-border rounded-lg text-[10px]">
            {unlockedTechs.length === 0
              ? 'No research available — hire a Developer Lv.2+'
              : 'All available research completed!'
            }
          </div>
        )}
        {visible.map(project => {
          const prereqsMet = project.prerequisites.every(p => unlockedTechs.includes(p));
          const isLocked = !prereqsMet;
          const currentLevel = unlockedLevels[project.id] ?? 0;
          const nextLevel = currentLevel + 1;
          const fullyUnlocked = unlockedTechs.includes(project.id) && nextLevel > project.maxLevel;

          return (
            <div key={project.id}
              className={`px-2.5 py-2 rounded-lg border transition-colors
                ${isLocked ? 'opacity-40 border-border bg-surface-2' : 'border-border bg-surface'}`}>
              {/* Header */}
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[10px] font-bold">{project.name}</span>
                <span className="text-[8px] px-1 py-[1px] rounded-sm font-bold shrink-0 leading-none text-white"
                  style={{ backgroundColor: CATEGORY_COLORS[project.category] }}>
                  {CATEGORY_LABELS[project.category]}
                </span>
                <span className="text-[8px] text-ink-soft">T{project.tier}</span>
                {currentLevel > 0 && (
                  <span className="text-[8px] px-1 py-[1px] rounded-sm bg-green-soft text-green font-bold">
                    Lv.{currentLevel}/{project.maxLevel}
                  </span>
                )}
              </div>
              <p className="text-[9px] text-ink-soft leading-relaxed mb-1">{project.description}</p>
              {project.prerequisites.length > 0 && (
                <div className="flex gap-1 mb-1 flex-wrap">
                  {project.prerequisites.map(p => {
                    const pDef = RESEARCH_TREE.find(r => r.id === p);
                    const pDone = unlockedTechs.includes(p);
                    return (
                      <span key={p}
                        className={`text-[7px] px-1 py-[1px] rounded-sm font-semibold ${pDone ? 'bg-green-soft text-green' : 'bg-amber-soft text-amber'}`}>
                        {pDone ? '✓ ' : ''}{pDef?.name ?? p}
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Level actions */}
              {fullyUnlocked ? (
                <span className="flex items-center gap-1 text-[10px] text-green font-semibold">
                  <CheckCircle className="w-3 h-3" /> Max Level
                </span>
              ) : isLocked ? (
                <div className="flex items-center gap-1 text-[9px] text-ink-soft">
                  <Clock className="w-2.5 h-2.5" />
                  <span>Complete prerequisites first</span>
                </div>
              ) : (
                <div className="space-y-1">
                  {[1, 2, 3, 4].map(lv => {
                    if (lv <= currentLevel) return null; // already done
                    if (lv > currentLevel + 1) return null; // must unlock sequentially
                    const cost = costForLevel(project.cost, lv);
                    const ticks = ticksForLevel(project.baseTicks, lv);
                    const devLv = minDevLevelForLevel(project.minDeveloperLevel, lv);
                    const check = canStartLevel(project, lv, unlockedTechs, unlockedLevels, employees);
                    const canDo = check.ok && !activeResearch && cash >= cost;
                    const isActive = activeResearch && activeResearch.projectId === project.id && activeResearch.targetLevel === lv;

                    if (isActive && activeProject) {
                      return (
                        <div key={lv} className="flex items-center gap-1.5 bg-indigo-soft/40 rounded-md px-2 py-1 border border-indigo/20">
                          <Microscope className="w-2.5 h-2.5 text-indigo shrink-0" />
                          <span className="text-[9px] font-semibold text-indigo flex-1">Researching Lv.{lv}...</span>
                          <span className="text-[8px] text-ink-soft font-mono">{progressPct}%</span>
                          <button onClick={cancelResearch} className="text-red hover:text-red/80 cursor-pointer">
                            <XCircle className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      );
                    }

                    return (
                      <button key={lv}
                        disabled={!canDo}
                        onClick={() => canDo && handleResearch(project.id, lv)}
                        className={`w-full flex items-center justify-between px-2 py-1 rounded-md text-[9px] font-semibold border transition-colors cursor-pointer
                          ${canDo ? 'bg-indigo text-white hover:bg-indigo/90 border-indigo/30' : 'bg-surface-2 text-ink-soft border-border cursor-not-allowed'}`}
                        title={!canDo && check.reason ? check.reason : ''}
                      >
                        <span className="flex items-center gap-1">
                          <ArrowUp className="w-2.5 h-2.5" />
                          {currentLevel === 0 ? 'Research' : 'Upgrade'} Lv.{lv}
                        </span>
                        <span className="flex items-center gap-1.5 text-[8px]">
                          <span>${cost.toLocaleString()}</span>
                          <span>{fmtTicks(ticks)}</span>
                          {devLv > 1 && <span>Dev Lv.{devLv}</span>}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Unlocked techs summary */}
      {unlockedTechs.length > 0 && (
        <details className="mt-1">
          <summary className="text-[10px] text-ink-soft cursor-pointer hover:text-ink font-semibold">
            Unlocked ({unlockedTechs.length})
          </summary>
          <div className="mt-1 space-y-0.5">
            {unlockedTechs.map(id => {
              const def = RESEARCH_TREE.find(r => r.id === id);
              return (
                <div key={id} className="flex items-center gap-1.5 px-2 py-1 text-[10px] text-ink-soft">
                  <CheckCircle className="w-3 h-3 text-green shrink-0" />
                  <span>{def?.name ?? id}</span>
                  <span className="text-[8px] px-1 py-[1px] rounded-sm font-bold shrink-0 leading-none text-white ml-auto"
                    style={{ backgroundColor: def ? CATEGORY_COLORS[def.category] : '#666' }}>
                    {def ? CATEGORY_LABELS[def.category] : ''}
                  </span>
                </div>
              );
            })}
          </div>
        </details>
      )}

      {/* Idle developers */}
      <div className="text-[10px] text-ink-soft">
        Idle Developers: <span className="font-semibold text-ink">{developers.length}</span>
        {activeResearch && <span className="ml-2">(1 assigned to research)</span>}
      </div>
    </div>
  );
}
