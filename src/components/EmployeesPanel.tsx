import { useEffect } from 'react';
import { Users, Lock, Unlock, Crown, GraduationCap, XCircle, AlertTriangle } from 'lucide-react';
import { useGameStore, getAvailableComponents, getLockedComponents } from '../store/gameStore';
import { getComponentDef } from '../data/components';
import type { Employee, EmployeeRole } from '../types';

const ROLES: EmployeeRole[] = ['Developer', 'Designer', 'HR'];

function formatCash(n: number): string {
  return `$${n.toLocaleString('en-US')}`;
}

function EmployeeCard({ employee }: { employee: Employee }) {
  const assignTask = useGameStore((s) => s.assignTask);
  const startTraining = useGameStore((s) => s.startTraining);
  const cancelTraining = useGameStore((s) => s.cancelTraining);
  const setPlayerRole = useGameStore((s) => s.setPlayerRole);
  const availableComponents = getAvailableComponents(employee.role, employee.level);
  const lockedComponents = getLockedComponents(employee.role, employee.level);
  const selectedId = useGameStore((s) => s.selectedEmployeeId);
  const isSelected = selectedId === employee.id;

  useEffect(() => {
    if (isSelected) {
      const el = document.getElementById(`empcard-${employee.id}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [isSelected, employee.id]);

  const happinessBadge = employee.happiness > 60 ? 'good' : employee.happiness > 30 ? 'warn' : 'low';
  const trainingMax = employee.level * 400;
  const isOverworked = employee.isPlayer && employee.overworkTicks >= 50;

  return (
    <div id={`empcard-${employee.id}`} className={`border-b border-surface-2 py-2 last:border-b-0 ${isSelected ? 'bg-indigo-soft -mx-[14px] px-[14px]' : ''}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-ink truncate">{employee.name}</span>
            {employee.isPlayer && <Crown className="w-3 h-3 text-amber" />}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-ink-soft">
            {employee.isPlayer ? (
              <select value={employee.role} onChange={e => setPlayerRole(employee.id, e.target.value as EmployeeRole)}
                className="bg-surface-2 border border-border rounded px-1.5 py-0.5 text-[10px] text-ink font-semibold cursor-pointer outline-none focus:border-indigo">
                {ROLES.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
              </select>
            ) : (
              <span>{employee.role.replace('_', ' ')}</span>
            )}
            <span>· Lv {employee.level}</span>
            {employee.isPlayer && <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber/20 text-amber font-semibold">Owner</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
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

      {/* Stats + Alerts */}
      <div className="flex items-center gap-2 mt-1 text-[11px] text-ink-soft">
        <span>{employee.speed.toFixed(1)}x speed</span>
        {isOverworked && <span className="flex items-center gap-0.5 text-amber font-bold"><AlertTriangle className="w-3 h-3" /> OVERWORKED</span>}
        {!employee.isPlayer && employee.happiness < 15 && <span className="text-red font-bold">RESIGN RISK</span>}
      </div>

      {/* Training progress */}
      {employee.isTraining ? (
        <div className="mt-1.5">
          <div className="flex justify-between text-[10px] text-ink-soft mb-0.5">
            <span className="flex items-center gap-1"><GraduationCap className="w-3 h-3" /> Training</span>
            <span>{Math.min(100, Math.round((employee.trainingProgress / trainingMax) * 100))}%</span>
          </div>
          <div className="w-full bg-surface-2 rounded h-1.5">
            <div className="bg-amber h-1.5 rounded transition-all duration-300" style={{ width: `${Math.min(100, (employee.trainingProgress / trainingMax) * 100)}%` }} />
          </div>
          <button onClick={() => cancelTraining(employee.id)}
            className="text-[9px] text-red hover:text-red/80 mt-0.5 flex items-center gap-0.5 cursor-pointer">
            <XCircle className="w-2.5 h-2.5" /> Cancel training
          </button>
        </div>
      ) : employee.currentTask ? (
        // Component production progress
        <div className="mt-1.5">
          <div className="flex justify-between text-[11px] text-ink-soft mb-0.5">
            <span>{employee.currentTask.replace(/_/g, ' ')}</span>
            <span>{Math.min(100, Math.round((employee.taskProgress / (getComponentDef(employee.currentTask)?.baseTicks ?? 1)) * 100))}%</span>
          </div>
          <div className="w-full bg-surface-2 rounded h-1.5">
            <div className="bg-indigo h-1.5 rounded transition-all duration-300" style={{ width: `${Math.min(100, (employee.taskProgress / (getComponentDef(employee.currentTask)?.baseTicks ?? 1)) * 100)}%` }} />
          </div>
        </div>
      ) : (
        // Task buttons
        <div className="flex flex-wrap gap-1 mt-1.5">
          {availableComponents.length > 0 && availableComponents.map((comp) => (
            <button key={comp.id} onClick={() => assignTask(employee.id, comp.id)}
              className="text-[10px] px-2 py-1 bg-surface-2 hover:bg-indigo-soft hover:text-indigo border border-border rounded transition-colors cursor-pointer flex items-center gap-1">
              <Unlock className="w-2.5 h-2.5" />{comp.name}
            </button>
          ))}
          {lockedComponents.length > 0 && lockedComponents.map((comp) => (
            <span key={comp.id} title={`Requires Lv.${comp.minLevel}`}
              className="text-[10px] px-2 py-1 bg-surface-2 border border-border rounded text-ink-soft flex items-center gap-1 opacity-60">
              <Lock className="w-2.5 h-2.5" />{comp.name} <span className="text-[8px]">Lv.{comp.minLevel}</span>
            </span>
          ))}
          {availableComponents.length === 0 && lockedComponents.length === 0 && !employee.isTraining && !employee.isPlayer && (
            <span className="text-[11px] text-ink-soft">No components available</span>
          )}
          {/* Training button for non-player, max level 3 */}
          {!employee.isPlayer && !employee.isTraining && employee.level < 3 && (
            <button onClick={() => startTraining(employee.id)}
              className="text-[10px] px-2 py-1 bg-amber-soft text-amber border border-amber/30 rounded hover:bg-amber hover:text-white transition-colors cursor-pointer flex items-center gap-1">
              <GraduationCap className="w-2.5 h-2.5" /> Train
            </button>
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