import { useEffect, useState } from 'react';
import { Users, Lock, Unlock, Crown, GraduationCap, XCircle, AlertTriangle, Gift, Plane, ChevronDown, ChevronUp, Star, UserMinus, Hammer } from 'lucide-react';
import { useGameStore, getAvailableComponents, getLockedComponents } from '../store/gameStore';
import { getComponentDef } from '../data/components';
import { calcMaxSupervised } from '../types/employee';
import { TICKS_PER_DAY } from '../constants';
import { getSupervisionBoost } from '../systems/leadDeveloper';
import type { Employee, EmployeeRole } from '../types';

const ROLES: EmployeeRole[] = ['Developer', 'Designer', 'HR'];

function formatCash(n: number): string {
  return `$${n.toLocaleString('en-US')}`;
}

function EmployeeCard({ employee }: { employee: Employee }) {
  const assignTask = useGameStore((s) => s.assignTask);
  const cancelTask = useGameStore((s) => s.cancelTask);
  const startTraining = useGameStore((s) => s.startTraining);
  const cancelTraining = useGameStore((s) => s.cancelTraining);
  const setPlayerRole = useGameStore((s) => s.setPlayerRole);
  const giveBonus = useGameStore((s) => s.giveBonus);
  const startVacation = useGameStore((s) => s.startVacation);
  const cancelVacation = useGameStore((s) => s.cancelVacation);
  const fireEmployee = useGameStore((s) => s.fireEmployee);
  const cash = useGameStore((s) => s.cash);
  const allEmployees = useGameStore((s) => s.employees);
  const availableComponents = getAvailableComponents(employee.role, employee.level);
  const lockedComponents = getLockedComponents(employee.role, employee.level);
  const selectedId = useGameStore((s) => s.selectedEmployeeId);
  const isSelected = selectedId === employee.id;
  const [showActions, setShowActions] = useState(false);
  const [showSupervision, setShowSupervision] = useState(false);
  const [showProduction, setShowProduction] = useState(false);
  const [vacationDays, setVacationDays] = useState(3);
  const isLead = employee.role === 'Lead_Developer';

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
        {employee.role === 'Lead_Developer' && employee.supervising && (
          <span className="flex items-center gap-0.5 text-indigo">
            <Star className="w-2.5 h-2.5" /> Supervising: {employee.supervising.length}/{calcMaxSupervised(employee.level)} (+{Math.round(getSupervisionBoost(employee) * 100)}% boost each)
          </span>
        )}
        {employee.supervisedBy && (() => {
          const lead = allEmployees.find(e => e.id === employee.supervisedBy);
          const boost = lead ? Math.round(getSupervisionBoost(lead) * 100) : 0;
          return <span className="text-indigo font-semibold">Supervised by {lead?.name ?? '—'} (+{boost}% output)</span>;
        })()}
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
          <button onClick={() => cancelTask(employee.id)}
            className="text-[9px] text-red hover:text-red/80 mt-0.5 flex items-center gap-0.5 cursor-pointer">
            <XCircle className="w-2.5 h-2.5" /> Cancel task
          </button>
        </div>
      ) : (
        // Task buttons
        <div className="flex flex-wrap gap-1 mt-1.5">
          {isLead ? (
            <>
              {!employee.isTraining && !employee.currentTask && employee.level < 3 && !employee.onVacation && (
                <button onClick={() => startTraining(employee.id)}
                  className="text-[10px] px-2 py-1 bg-amber-soft text-amber border border-amber/30 rounded hover:bg-amber hover:text-white transition-colors cursor-pointer flex items-center gap-1">
                  <GraduationCap className="w-2.5 h-2.5" /> Train
                </button>
              )}
              <button onClick={() => { setShowSupervision(!showSupervision); setShowProduction(false); }}
                className={`text-[10px] px-2 py-1 border border-border rounded transition-colors cursor-pointer flex items-center gap-1 ${showSupervision ? 'bg-indigo-soft text-indigo' : 'bg-surface-2 text-ink-soft hover:text-ink'}`}>
                <Star className="w-2.5 h-2.5" /> Supervision
              </button>
              <button onClick={() => { setShowProduction(!showProduction); setShowSupervision(false); }}
                className={`text-[10px] px-2 py-1 border border-border rounded transition-colors cursor-pointer flex items-center gap-1 ${showProduction ? 'bg-amber-soft text-amber' : 'bg-surface-2 text-ink-soft hover:text-ink'}`}>
                <Hammer className="w-2.5 h-2.5" /> Production
              </button>
            </>
          ) : (
            <>
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
              {!employee.isTraining && !employee.currentTask && employee.level < 3 && !employee.onVacation && (
                <button onClick={() => startTraining(employee.id)}
                  className="text-[10px] px-2 py-1 bg-amber-soft text-amber border border-amber/30 rounded hover:bg-amber hover:text-white transition-colors cursor-pointer flex items-center gap-1">
                  <GraduationCap className="w-2.5 h-2.5" /> Train
                </button>
              )}
            </>
          )}
          {/* Actions toggle */}
          <button onClick={() => setShowActions(!showActions)}
            className="text-[10px] px-2 py-1 bg-surface-2 border border-border rounded text-ink-soft hover:text-ink transition-colors cursor-pointer flex items-center gap-1">
            {showActions ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
            Actions
          </button>
        </div>
      )}

      {/* Vacation progress */}
      {employee.onVacation && (
        <div className="mt-1.5">
          <div className="flex justify-between text-[10px] text-ink-soft mb-0.5">
            <span className="flex items-center gap-1"><Plane className="w-3 h-3" /> Vacation</span>
            <span>{Math.ceil(employee.vacationTicksLeft / TICKS_PER_DAY)}d left</span>
          </div>
          <div className="flex gap-1.5 items-center">
            <div className="flex-1 h-1.5 bg-surface-2 rounded-full overflow-hidden">
              <div className="h-full bg-green rounded-full transition-all duration-300" style={{ width: `${employee.vacationTotal ? ((employee.vacationTotal - employee.vacationTicksLeft) / employee.vacationTotal * 100) : 0}%` }} />
            </div>
            <button onClick={() => cancelVacation(employee.id)}
              className="text-[9px] text-red hover:text-red/80 cursor-pointer shrink-0">Cut short</button>
          </div>
        </div>
      )}

      {/* Actions panel */}
      {showActions && !employee.onVacation && (
        <div className="mt-1.5 p-2 rounded-lg bg-surface-2 border border-border space-y-1.5">
          <button onClick={() => giveBonus(employee.id)}
            className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
              cash >= 200 ? 'bg-surface border border-border hover:border-green text-ink' : 'bg-surface border border-border opacity-40 cursor-not-allowed text-ink-soft'
            }`}>
            <span className="flex items-center gap-1"><Gift className="w-3 h-3 text-green" /> Give Bonus</span>
            <span className="font-mono">+20 happy · $200</span>
          </button>
          <div className="flex items-center gap-1.5">
            <Plane className="w-3 h-3 text-indigo shrink-0" />
            <span className="text-[10px] text-ink-soft shrink-0">Vacation:</span>
            <select value={vacationDays} onChange={e => setVacationDays(Number(e.target.value))}
              className="bg-surface border border-border rounded px-1.5 py-1 text-[10px] text-ink font-semibold cursor-pointer outline-none">
              {[1,2,3,4,5,6,7].map(d => <option key={d} value={d}>{d} day{d > 1 ? 's' : ''}</option>)}
            </select>
            <button onClick={() => startVacation(employee.id, vacationDays)}
              className="px-2 py-1 bg-indigo hover:bg-indigo/90 text-white text-[10px] font-semibold rounded transition-colors cursor-pointer">
              Start
            </button>
          </div>
          {!employee.isPlayer && (
            <button onClick={() => fireEmployee(employee.id)}
              className="w-full flex items-center justify-center gap-1 px-2 py-1.5 rounded text-[10px] font-semibold bg-red/10 text-red hover:bg-red/20 transition-colors cursor-pointer">
              <XCircle className="w-3 h-3" /> Fire Employee
            </button>
          )}
        </div>
      )}

      {/* Supervision panel */}
      {showSupervision && isLead && !employee.onVacation && (
        <SupervisionPanel lead={employee} employees={allEmployees} />
      )}

      {/* Production panel */}
      {showProduction && isLead && !employee.onVacation && (
        <ProductionPanel lead={employee} employees={allEmployees} />
      )}
    </div>
  );
}

function SupervisionPanel({ lead, employees }: { lead: Employee; employees: Employee[] }) {
  const assignDev = useGameStore((s) => s.assignDeveloperToLead);
  const unassignDev = useGameStore((s) => s.unassignDeveloperFromLead);
  const maxSupervised = calcMaxSupervised(lead.level);
  const currentCount = lead.supervising?.length ?? 0;
  const supervisedDevs = employees.filter(e => e.supervisedBy === lead.id);
  const availableDevs = employees.filter(e =>
    e.role === 'Developer' && !e.supervisedBy && e.id !== lead.id
  );
  const isFull = currentCount >= maxSupervised;

  return (
    <div className="mt-1.5 p-2 rounded-lg bg-surface-2 border border-border space-y-1.5">
      <div className="flex items-center justify-between text-[10px] font-semibold text-ink-soft">
        <span className="flex items-center gap-1"><Star className="w-3 h-3 text-indigo" /> Supervision</span>
        <span>{currentCount}/{maxSupervised}</span>
      </div>
      <div className="space-y-1 max-h-[160px] overflow-y-auto">
        {supervisedDevs.map(dev => (
          <div key={dev.id} className="flex items-center justify-between px-2 py-1 rounded bg-surface border border-border">
            <span className="text-[10px] text-ink">{dev.name} <span className="text-ink-soft">Lv.{dev.level}</span></span>
            <button onClick={() => unassignDev(dev.id)}
              className="flex items-center gap-1 text-[9px] text-red hover:text-red/80 font-semibold cursor-pointer">
              <UserMinus className="w-2.5 h-2.5" /> Unassign
            </button>
          </div>
        ))}
        {!isFull && availableDevs.length > 0 && availableDevs.map(dev => (
          <div key={dev.id} className="flex items-center justify-between px-2 py-1 rounded bg-surface border border-dashed border-indigo/30">
            <span className="text-[10px] text-indigo">{dev.name} <span className="text-indigo-soft">Lv.{dev.level}</span></span>
            <button onClick={() => assignDev(lead.id, dev.id)}
              className="text-[9px] text-indigo hover:text-indigo/80 font-semibold cursor-pointer">Assign</button>
          </div>
        ))}
        {supervisedDevs.length === 0 && availableDevs.length === 0 && (
          <span className="text-[10px] text-ink-soft">No developers available</span>
        )}
        {isFull && <span className="text-[10px] text-amber font-semibold block">Cap reached — train to supervise more</span>}
      </div>
    </div>
  );
}

function ProductionPanel({ lead, employees }: { lead: Employee; employees: Employee[] }) {
  const assignTask = useGameStore((s) => s.assignTask);
  const cancelTask = useGameStore((s) => s.cancelTask);
  const supervisedDevs = employees.filter(e => e.supervisedBy === lead.id);
  const anyWorking = supervisedDevs.some(d => d.currentTask !== null);
  const allComponents = supervisedDevs.length > 0
    ? [...new Map(supervisedDevs.flatMap(dev =>
        getAvailableComponents(dev.role, dev.level).map(c => [c.id, c])
      )).values()]
    : [];

  function assignComponentToAll(componentId: string) {
    for (const dev of supervisedDevs) {
      const avail = getAvailableComponents(dev.role, dev.level);
      if (avail.some(c => c.id === componentId) && !dev.currentTask && !dev.isTraining && !dev.onVacation) {
        assignTask(dev.id, componentId);
      }
    }
  }

  function cancelAllTasks() {
    for (const dev of supervisedDevs) {
      if (dev.currentTask) cancelTask(dev.id);
    }
  }

  if (supervisedDevs.length === 0) {
    return (
      <div className="mt-1.5 p-2 rounded-lg bg-surface-2 border border-border">
        <div className="flex items-center text-[10px] font-semibold text-ink-soft">
          <span className="flex items-center gap-1"><Hammer className="w-3 h-3 text-amber" /> Production</span>
        </div>
        <span className="text-[10px] text-ink-soft block mt-1">Assign developers first</span>
      </div>
    );
  }

  return (
    <div className="mt-1.5 p-2 rounded-lg bg-surface-2 border border-border space-y-1.5">
      <div className="flex items-center justify-between text-[10px] font-semibold text-ink-soft">
        <span className="flex items-center gap-1"><Hammer className="w-3 h-3 text-amber" /> Production</span>
        {anyWorking && (
          <button onClick={cancelAllTasks}
            className="flex items-center gap-1 text-[9px] text-red hover:text-red/80 font-semibold cursor-pointer">
            <XCircle className="w-2.5 h-2.5" /> Cancel All
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-1 max-h-[160px] overflow-y-auto content-start">
        {allComponents.map(comp => (
          <button key={comp.id} onClick={() => assignComponentToAll(comp.id)}
            className="text-[10px] px-2 py-1 bg-surface border border-border rounded hover:bg-amber-soft hover:text-amber hover:border-amber/30 transition-colors cursor-pointer flex items-center gap-1">
            <Unlock className="w-2.5 h-2.5" />{comp.name}
          </button>
        ))}
      </div>
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