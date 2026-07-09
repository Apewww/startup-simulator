import { useGameStore } from '../store/gameStore';
import { CharacterAvatar, roleColor } from './CharacterAvatar';

const GRID_COLS = 8;
const GRID_ROWS = 8;
const TOTAL_CELLS = GRID_COLS * GRID_ROWS;

function getStatusText(task: string | null): string {
  if (!task) return 'Idle';
  return task.replace(/_/g, ' ');
}

function getStatusColor(task: string | null, happiness: number): string {
  if (happiness < 15) return 'border-danger bg-danger/10';
  if (happiness < 30) return 'border-orange-600 bg-orange-900/20';
  if (task) return 'border-primary bg-primary/10';
  return 'border-profit bg-profit/10';
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
    <div className="border-2 border-border bg-bg-surface">
      <div className="px-4 py-3 border-b-2 border-border flex items-center gap-3">
        <h2 className="text-lg font-semibold text-text-primary">Office Floor</h2>
        <span className="text-xs text-text-muted">{employees.length} / {TOTAL_CELLS} desks</span>
      </div>
      <div className="p-4 overflow-x-auto">
        <div className="grid grid-cols-6 md:grid-cols-8 gap-2 mx-auto" style={{ maxWidth: 560 }}>
          {cells.map((cell) => {
            if (!cell.employee) {
              return (
                <div
                  key={cell.index}
                  className="aspect-square border-2 border-dashed border-border bg-bg-card/30"
                />
              );
            }

            const emp = cell.employee;
            const statusColor = getStatusColor(emp.currentTask, emp.happiness);
            const progress = emp.currentTask
              ? Math.min(100, Math.round((emp.taskProgress / 20) * 100))
              : 0;

            return (
              <button
                key={cell.index}
                onClick={() => focusEmployee(emp.id)}
                className={`aspect-square border-2 flex flex-col items-center justify-center relative transition-colors cursor-pointer group ${statusColor}`}
                title={`${emp.name} (${emp.role.replace('_', ' ')}) - ${getStatusText(emp.currentTask)} - ${emp.happiness.toFixed(0)}% happiness`}
              >
                <CharacterAvatar role={emp.role} size={22} />
                <span className="text-[9px] leading-none mt-1 font-semibold" style={{ color: roleColor(emp.role) }}>
                  {emp.name}
                </span>
                {emp.currentTask && (
                  <div className="absolute -bottom-1 left-1 right-1 h-1.5 bg-bg-base/60 overflow-hidden">
                    <div
                      className="h-full bg-steel transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ backgroundColor: emp.happiness > 60 ? '#22C55E' : emp.happiness > 30 ? '#D97706' : '#DC2626' }}
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}