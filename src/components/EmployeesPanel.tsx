import { useEffect } from 'react';
import { Users } from 'lucide-react';
import { useGameStore, getComponentsByRole } from '../store/gameStore';
import type { Employee } from '../types';

function formatCash(n: number): string {
  return `$${n.toLocaleString('en-US')}`;
}

function EmployeeCard({ employee }: { employee: Employee }) {
  const assignTask = useGameStore((s) => s.assignTask);
  const availableComponents = getComponentsByRole(employee.role);
  const selectedId = useGameStore((s) => s.selectedEmployeeId);
  const isSelected = selectedId === employee.id;

  useEffect(() => {
    if (isSelected) {
      const el = document.getElementById(`empcard-${employee.id}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [isSelected, employee.id]);

  const happinessBadge = employee.happiness > 60 ? 'good' : employee.happiness > 30 ? 'warn' : 'low';

  return (
    <div
      id={`empcard-${employee.id}`}
      className={`border-b border-surface-2 py-2 last:border-b-0 ${isSelected ? 'bg-indigo-soft -mx-[14px] px-[14px]' : ''}`}
    >
      <div className="flex justify-between items-center">
        <div>
          <div className="text-xs font-semibold text-ink">{employee.name}</div>
          <div className="text-[11px] text-ink-soft">{employee.role.replace('_', ' ')} · Lv {employee.level}</div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold px-2 py-[3px] rounded-full ${
            happinessBadge === 'good' ? 'bg-green-soft text-green' :
            happinessBadge === 'warn' ? 'bg-amber-soft text-amber' :
            'bg-red-soft text-red'
          }`}>
            {employee.happiness.toFixed(0)}%
          </span>
          <span className="text-[11px] text-ink-soft font-mono">{formatCash(employee.salary)}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-1 text-[11px] text-ink-soft">
        <span>{employee.speed.toFixed(1)}x speed</span>
        {employee.happiness < 15 && <span className="text-red font-bold">RESIGN RISK</span>}
      </div>

      {employee.currentTask ? (
        <div className="mt-1.5">
          <div className="flex justify-between text-[11px] text-ink-soft mb-0.5">
            <span>{employee.currentTask.replace(/_/g, ' ')}</span>
            <span>{Math.min(100, Math.round((employee.taskProgress / 20) * 100))}%</span>
          </div>
          <div className="w-full bg-surface-2 rounded h-1.5">
            <div className="bg-indigo h-1.5 rounded transition-all duration-300" style={{ width: `${Math.min(100, (employee.taskProgress / 20) * 100)}%` }} />
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {availableComponents.length > 0 ? (
            availableComponents.map((comp) => (
              <button
                key={comp.id}
                onClick={() => assignTask(employee.id, comp.id)}
                className="text-[10px] px-2 py-1 bg-surface-2 hover:bg-indigo-soft hover:text-indigo border border-border rounded transition-colors cursor-pointer"
              >
                {comp.name}
              </button>
            ))
          ) : (
            <span className="text-[11px] text-ink-soft">No components available</span>
          )}
        </div>
      )}
    </div>
  );
}

export function EmployeesPanel() {
  const employees = useGameStore((s) => s.employees);

  return (
    <div className="space-y-2">
      {employees.length === 0 ? (
        <div className="text-center py-6 text-ink-soft border border-dashed border-border rounded-lg">
          <Users className="w-8 h-8 mx-auto mb-2 opacity-40" strokeWidth={1.5} />
          <p className="text-xs">No employees yet.</p>
          <p className="text-[10px] mt-1">Use the <span className="text-indigo font-semibold">Rekrutmen</span> panel to find and hire talent!</p>
        </div>
      ) : (
        <div className="space-y-1">
          {employees.map((emp) => (
            <EmployeeCard key={emp.id} employee={emp} />
          ))}
        </div>
      )}
    </div>
  );
}

export const employeesPanelMeta = { title: 'Karyawan', icon: <Users className="w-4 h-4 text-indigo" />, accent: '#4F5EFF' };