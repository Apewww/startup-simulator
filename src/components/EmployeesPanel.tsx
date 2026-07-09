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
      className={`bg-gray-800/70 rounded p-3 border transition-all duration-200 ${
        isSelected ? 'border-[#7C3AED] ring-2 ring-[#7C3AED]/50 shadow-[0_0_12px_#7C3AED66]' : 'border-gray-700'
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <span className="font-semibold text-white">{employee.name}</span>
          <span className="ml-2 text-xs px-2 py-0.5 bg-gray-700 rounded text-gray-300">{employee.role.replace('_', ' ')}</span>
          <span className="ml-2 text-xs text-gray-400">Lv.{employee.level}</span>
          <span className="ml-2 text-xs font-mono" style={{ color: employee.happiness > 60 ? '#4ade80' : employee.happiness > 30 ? '#fbbf24' : '#ef4444' }}>
            {employee.happiness.toFixed(0)}%
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">{employee.speed.toFixed(1)}x</span>
          <span className="text-sm text-gray-400">{formatCash(employee.salary)}/mo</span>
          {employee.happiness < 15 && (
            <span className="text-xs text-red-400 animate-pulse" title="At risk of resigning!">RESIGN</span>
          )}
        </div>
      </div>

      {employee.currentTask ? (
        <div className="mt-2">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>{employee.currentTask.replace(/_/g, ' ')}</span>
            <span>{Math.min(100, Math.round((employee.taskProgress / 20) * 100))}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded h-2">
            <div className="bg-blue-500 h-2 rounded transition-all duration-300" style={{ width: `${Math.min(100, (employee.taskProgress / 20) * 100)}%` }} />
          </div>
        </div>
      ) : (
        <div className="mt-2 flex flex-wrap gap-1">
          {availableComponents.length > 0 ? (
            availableComponents.map((comp) => (
              <button
                key={comp.id}
                onClick={() => assignTask(employee.id, comp.id)}
                className="text-xs px-2 py-1 bg-gray-700 hover:bg-blue-700 rounded transition-colors cursor-pointer"
              >
                {comp.name}
              </button>
            ))
          ) : (
            <span className="text-xs text-gray-500">No components available</span>
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
            className="px-3 py-1.5 bg-indigo-700 hover:bg-indigo-600 rounded text-sm transition-colors cursor-pointer"
          >
            Hire {role.replace('_', ' ')}
          </button>
        ))}
      </div>
      {employees.length === 0 ? (
        <p className="text-gray-500 text-sm">No employees yet. Hire your first team member!</p>
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

export const employeesPanelMeta = { title: 'Employees', icon: <Users className="w-4 h-4 text-[#3B82F6]" />, accent: '#3B82F6' };
