import { useEffect } from 'react';
import { Users, UserPlus } from 'lucide-react';
import { useGameStore, getComponentsByRole } from '../store/gameStore';
import type { EmployeeRole, Employee } from '../types';

const ROLES: EmployeeRole[] = ['Developer', 'Designer', 'Lead_Developer', 'SysAdmin'];

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
  const { employees, hireEmployee } = useGameStore();

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {ROLES.map((role) => (
          <button
            key={role}
            onClick={() => hireEmployee(role)}
            className="flex items-center gap-1 px-3 py-1.5 bg-indigo hover:bg-indigo/90 text-white text-[11px] font-semibold rounded-lg transition-colors cursor-pointer"
          >
            <UserPlus className="w-3 h-3" />
            {role.replace('_', ' ')}
          </button>
        ))}
      </div>
      {employees.length === 0 ? (
        <p className="text-ink-soft text-xs text-center py-4">No employees yet. Hire your first team member!</p>
      ) : (
        <div>
          {employees.map((emp) => (
            <EmployeeCard key={emp.id} employee={emp} />
          ))}
        </div>
      )}
    </div>
  );
}

export const employeesPanelMeta = { title: 'Karyawan', icon: <Users className="w-4 h-4 text-indigo" />, accent: '#4F5EFF' };