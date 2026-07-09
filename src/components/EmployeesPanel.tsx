import { useEffect } from 'react';
import { Users } from 'lucide-react';
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

  return (
    <div
      id={`empcard-${employee.id}`}
      className={`bg-bg-card border-2 transition-colors p-3 ${
        isSelected ? 'border-primary' : 'border-border'
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <span className="font-semibold text-text-primary">{employee.name}</span>
          <span className="ml-2 text-xs px-2 py-0.5 bg-bg-surface border border-border text-text-secondary">{employee.role.replace('_', ' ')}</span>
          <span className="ml-2 text-xs text-text-muted">Lv.{employee.level}</span>
          <span className="ml-2 text-xs font-mono" style={{ color: employee.happiness > 60 ? '#22C55E' : employee.happiness > 30 ? '#D97706' : '#DC2626' }}>
            {employee.happiness.toFixed(0)}%
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">{employee.speed.toFixed(1)}x</span>
          <span className="text-sm text-text-muted">{formatCash(employee.salary)}/mo</span>
          {employee.happiness < 15 && (
            <span className="text-xs text-danger" title="At risk of resigning!">RESIGN</span>
          )}
        </div>
      </div>

      {employee.currentTask ? (
        <div className="mt-2">
          <div className="flex justify-between text-xs text-text-muted mb-1">
            <span>{employee.currentTask.replace(/_/g, ' ')}</span>
            <span>{Math.min(100, Math.round((employee.taskProgress / 20) * 100))}%</span>
          </div>
          <div className="w-full bg-bg-base h-2">
            <div className="bg-primary h-2 transition-all duration-300" style={{ width: `${Math.min(100, (employee.taskProgress / 20) * 100)}%` }} />
          </div>
        </div>
      ) : (
        <div className="mt-2 flex flex-wrap gap-1">
          {availableComponents.length > 0 ? (
            availableComponents.map((comp) => (
              <button
                key={comp.id}
                onClick={() => assignTask(employee.id, comp.id)}
                className="text-xs px-2 py-1 bg-bg-hover hover:bg-primary hover:text-white border border-border transition-colors cursor-pointer"
              >
                {comp.name}
              </button>
            ))
          ) : (
            <span className="text-xs text-text-muted">No components available</span>
          )}
        </div>
      )}
    </div>
  );
}

export function EmployeesPanel() {
  const { employees, hireEmployee } = useGameStore();

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {ROLES.map((role) => (
          <button
            key={role}
            onClick={() => hireEmployee(role)}
            className="px-3 py-1.5 bg-primary hover:bg-steel text-white transition-colors cursor-pointer"
          >
            Hire {role.replace('_', ' ')}
          </button>
        ))}
      </div>
      {employees.length === 0 ? (
        <p className="text-text-muted text-sm">No employees yet. Hire your first team member!</p>
      ) : (
        <div className="space-y-2">
          {employees.map((emp) => (
            <EmployeeCard key={emp.id} employee={emp} />
          ))}
        </div>
      )}
    </div>
  );
}

export const employeesPanelMeta = { title: 'Employees', icon: <Users className="w-4 h-4 text-steel" />, accent: '#2563EB' };