import { useGameStore } from '../store/gameStore';
import type { EmployeeRole } from '../types';

const GRID_COLS = 8;
const GRID_ROWS = 8;
const TOTAL_CELLS = GRID_COLS * GRID_ROWS;

const ROLE_ICONS: Record<EmployeeRole, string> = {
  Developer: '</>',
  Designer: '◎',
  Lead_Developer: '★',
  SysAdmin: '⚙',
};

function getStatusText(task: string | null): string {
  if (!task) return 'Idle';
  return task.replace(/_/g, ' ');
}

function getStatusColor(task: string | null, happiness: number): string {
  if (happiness < 15) return 'from-red-600 to-red-800 border-red-400';
  if (happiness < 30) return 'from-orange-600 to-orange-800 border-orange-400';
  if (task) return 'from-blue-600 to-blue-800 border-blue-400';
  return 'from-green-700 to-green-900 border-green-500';
}

function getDeskColor(happiness: number): string {
  if (happiness < 30) return 'bg-amber-700';
  if (happiness < 60) return 'bg-amber-600';
  return 'bg-amber-500';
}

export function OfficeGrid() {
  const employees = useGameStore((s) => s.employees);

  const cells = Array.from({ length: TOTAL_CELLS }, (_, i) => ({
    index: i,
    employee: employees[i] || null,
    isEmpty: i >= employees.length,
  }));

  return (
    <div className="bg-gray-800 rounded border border-gray-700 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-700 flex items-center gap-3">
        <h2 className="text-lg font-semibold">Office</h2>
        <span className="text-xs text-gray-400">{employees.length} / {TOTAL_CELLS} desks</span>
      </div>
      <div className="p-4">
        <div
          className="grid gap-2 mx-auto"
          style={{
            gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))`,
            maxWidth: 520,
          }}
        >
          {cells.map((cell) => {
            if (!cell.employee) {
              return (
                <div
                  key={cell.index}
                  className="aspect-square rounded bg-gray-750 border border-dashed border-gray-700"
                  style={{ backgroundColor: '#1a1a2e' }}
                />
              );
            }

            const emp = cell.employee;
            const statusColor = getStatusColor(emp.currentTask, emp.happiness);
            const progress = emp.currentTask
              ? Math.min(100, Math.round((emp.taskProgress / 20) * 100))
              : 0;

            return (
              <div
                key={cell.index}
                className={`aspect-square rounded-lg border-2 flex flex-col items-center justify-center relative transition-all duration-300 ${statusColor} cursor-pointer group`}
                title={`${emp.name} (${emp.role.replace('_', ' ')}) - ${getStatusText(emp.currentTask)} - ${emp.happiness.toFixed(0)}% happiness`}
              >
                <div className={`w-4 h-2 rounded-t-sm mb-0.5 ${getDeskColor(emp.happiness)}`} />
                <span className="text-xs font-mono leading-none">{emp.name[0]}</span>
                <span className="text-[8px] text-gray-300 leading-none mt-0.5 opacity-70">
                  {ROLE_ICONS[emp.role]}
                </span>
                {emp.currentTask && (
                  <div className="absolute -bottom-1 left-1 right-1 h-1 bg-gray-900/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-400 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}
                <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ backgroundColor: emp.happiness > 60 ? '#4ade80' : emp.happiness > 30 ? '#fbbf24' : '#ef4444' }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}