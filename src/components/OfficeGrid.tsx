import { useGameStore } from '../store/gameStore';
import { CharacterAvatar, roleColor } from './CharacterAvatar';

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

  const cells = Array.from({ length: TOTAL_CELLS }, (_, i) => ({
    index: i,
    employee: employees[i] || null,
    isEmpty: i >= employees.length,
  }));

  return (
    <div className="card p-5 flex-1">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-[18px] font-extrabold tracking-tight">Office Grid</h2>
          <p className="text-xs text-ink-soft mt-0.5">{employees.length} / {TOTAL_CELLS} meja terisi</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="grid grid-cols-6 md:grid-cols-8 gap-2.5 mx-auto" style={{ maxWidth: 560 }}>
          {cells.map((cell) => {
            if (!cell.employee) {
              return (
                <div
                  key={cell.index}
                  className="aspect-square rounded-lg bg-surface-2 border border-dashed border-border"
                />
              );
            }

            const emp = cell.employee;
            const deskClass = getDeskClass(emp.currentTask, emp.happiness);
            const progress = emp.currentTask
              ? Math.min(100, Math.round((emp.taskProgress / 20) * 100))
              : 0;

            const avatarColor = deskClass === 'working' ? '#17A366' : deskClass === 'low' ? '#D1453B' : '#4F5EFF';

            return (
              <button
                key={cell.index}
                onClick={() => focusEmployee(emp.id)}
                className={`aspect-square rounded-lg border flex flex-col items-center justify-center relative transition-colors cursor-pointer group ${
                  deskClass === 'empty' ? 'border-dashed border-border bg-surface-2' :
                  deskClass === 'working' ? 'border-green bg-green-soft' :
                  deskClass === 'low' ? 'border-red bg-red-soft' :
                  'border-border bg-surface-2'
                }`}
                title={`${emp.name} (${emp.role.replace('_', ' ')}) - ${getStatusText(emp.currentTask)} - ${emp.happiness.toFixed(0)}% happiness`}
              >
                <div className="w-[22px] h-[22px] rounded-md" style={{ backgroundColor: avatarColor, opacity: deskClass === 'idle' ? 0.55 : 1 }} />
                <span className="text-[9px] font-semibold mt-1 truncate max-w-full px-0.5" style={{ color: roleColor(emp.role) }}>
                  {emp.name}
                </span>
                {emp.currentTask && (
                  <div className="absolute bottom-1 left-2 right-2 h-1 bg-ink/10 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}