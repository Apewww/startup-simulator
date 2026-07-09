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
  if (happiness < 15) return 'from-red-600/80 to-red-800/80 border-red-400';
  if (happiness < 30) return 'from-orange-600/80 to-orange-800/80 border-orange-400';
  if (task) return 'from-blue-600/80 to-blue-800/80 border-blue-400';
  return 'from-green-700/80 to-green-900/80 border-green-500';
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
    <div className="rounded-2xl overflow-hidden border border-[#7C3AED]/30 bg-gradient-to-br from-[#0d1330] to-[#0a0e27]">
      <div className="px-4 py-3 border-b border-[#7C3AED]/30 flex items-center gap-3">
        <h2 className="text-lg font-semibold font-['Space_Grotesk'] text-[#A78BFA]">Office Floor</h2>
        <span className="text-xs text-gray-400">{employees.length} / {TOTAL_CELLS} desks</span>
      </div>
      <div className="p-4 overflow-x-auto">
        <div className="grid grid-cols-6 md:grid-cols-8 gap-2 mx-auto" style={{ maxWidth: 560 }}>
          {cells.map((cell) => {
            if (!cell.employee) {
              return (
                <div
                  key={cell.index}
                  className="aspect-square rounded-lg border border-dashed border-gray-700/70 bg-white/[0.02]"
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
                className={`aspect-square rounded-xl border-2 flex flex-col items-center justify-center relative transition-all duration-200 active:scale-95 ${statusColor} cursor-pointer group bg-gradient-to-b from-white/5 to-transparent`}
                title={`${emp.name} (${emp.role.replace('_', ' ')}) - ${getStatusText(emp.currentTask)} - ${emp.happiness.toFixed(0)}% happiness`}
              >
                <CharacterAvatar role={emp.role} size={22} />
                <span className="text-[9px] text-gray-100 leading-none mt-1 font-['Space_Grotesk'] font-medium" style={{ color: roleColor(emp.role) }}>
                  {emp.name}
                </span>
                {emp.currentTask && (
                  <div className="absolute -bottom-1 left-1 right-1 h-1.5 bg-black/40 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-400 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ backgroundColor: emp.happiness > 60 ? '#4ade80' : emp.happiness > 30 ? '#fbbf24' : '#ef4444' }}
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
