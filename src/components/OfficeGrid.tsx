import { Star } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { getComponentDef } from '../data/components';
import { roleColor } from './CharacterAvatar';

const GRID_COLS = 8;
const GRID_ROWS = 8;
const TOTAL_CELLS = GRID_COLS * GRID_ROWS;

function getStatusText(task: string | null): string {
  if (!task) return 'Idle';
  return task.replace(/_/g, ' ');
}

function getDeskClass(task: string | null, happiness: number): string {
  if (happiness < 15) return 'low';
  if (happiness < 30) return 'idle';
  if (task) return 'working';
  return 'idle';
}

export function OfficeGrid() {
  const employees = useGameStore((s) => s.employees);
  const focusEmployee = useGameStore((s) => s.focusEmployee);
  const darkMode = useGameStore((s) => s.darkMode);

  const deskMap = new Map(employees.map(e => [e.deskIndex, e]));
  const cells = Array.from({ length: TOTAL_CELLS }, (_, i) => ({
    index: i,
    employee: deskMap.get(i) || null,
  }));

  return (
    <div className="card p-5 flex-1">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-[18px] font-extrabold tracking-tight">Office Grid</h2>
          <p className="text-xs text-ink-soft mt-0.5">{employees.length} / {TOTAL_CELLS} meja terisi</p>
        </div>
      </div>

      <div>
        <div className="grid grid-cols-6 md:grid-cols-8 gap-2.5 mx-auto" style={{ maxWidth: 560 }}>
          {cells.map((cell) => {
            const emp = cell.employee;
            if (!emp) {
              return (
                <div
                  key={cell.index}
                  className="aspect-square rounded-lg bg-surface-2 border border-dashed border-border"
                />
              );
            }
            const deskClass = getDeskClass(emp.currentTask, emp.happiness);
            const progress = emp.currentTask
              ? Math.min(100, Math.round((emp.taskProgress / (getComponentDef(emp.currentTask)?.baseTicks ?? 1)) * 100))
              : 0;

            const bgColorWorking = darkMode ? 'bg-green/20' : 'bg-green-soft';
            const borderColorWorking = darkMode ? 'border-green' : 'border-green';
            const bgColorLow = darkMode ? 'bg-red/20' : 'bg-red-soft';
            const borderColorLow = darkMode ? 'border-red' : 'border-red';
            const bgColorIdle = darkMode ? 'bg-surface-2' : 'bg-surface-2';
            const borderColorIdle = darkMode ? 'border-border' : 'border-border';

            const avatarColor = deskClass === 'working' ? (darkMode ? '#34D399' : '#17A366') : deskClass === 'low' ? (darkMode ? '#F87171' : '#D1453B') : (darkMode ? '#94A3B8' : '#4F5EFF');

            return (
              <button
                key={cell.index}
                onClick={() => focusEmployee(emp.id)}
                className={`aspect-square rounded-lg border flex flex-col items-center justify-center relative transition-colors cursor-pointer group ${deskClass === 'empty' ? 'border-dashed border-border bg-surface-2' :
                    deskClass === 'working' ? `${borderColorWorking} ${bgColorWorking}` :
                      deskClass === 'low' ? `${borderColorLow} ${bgColorLow}` :
                        `${borderColorIdle} ${bgColorIdle}`
                  }${emp.role === 'Lead_Developer' ? ' ring-2 ring-indigo/60' : ''}`}
                title={`${emp.name} (${emp.role.replace('_', ' ')})${emp.supervisedBy ? ' (supervised)' : ''} - ${getStatusText(emp.currentTask)} - ${emp.happiness.toFixed(0)}% happiness`}
              >
                <div className="w-[22px] h-[22px] rounded-md" style={{ backgroundColor: avatarColor, opacity: deskClass === 'idle' ? 0.55 : 1 }} />
                <span className="text-[9px] font-semibold mt-1 truncate max-w-full px-0.5" style={{ color: roleColor(emp.role) }}>
                  {emp.name}
                </span>
                {emp.currentTask && (
                  <div className="absolute bottom-1 left-2 right-2 h-1 bg-ink/10 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo rounded-full transition-all duration-300 ease-out" style={{ width: `${progress}%` }} />
                  </div>
                )}
                {emp.happiness < 15 && (
                  <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red rounded-full animate-pulse z-10" title="Resign risk!" />
                )}
                {emp.role === 'Lead_Developer' && (
                  <Star className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 text-indigo drop-shadow z-20" strokeWidth={2.5} />
                )}
                {emp.supervisedBy && (
                  <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-indigo rounded-full z-10" title="Supervised" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}