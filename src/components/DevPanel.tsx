import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import type { EmployeeRole } from '../types';
import { COMPONENTS } from '../data/components';
import { NODE_DEFS, RACK_TIERS } from '../data/servers';

const ROLES: EmployeeRole[] = ['Developer', 'Designer', 'Lead_Developer', 'SysAdmin'];

export function DevPanel() {
  const { devMode, toggleDevMode, cash, addCash, employees, hireEmployee, addResources, features, unlockAllFeatures, racks, fillRack, selectedProduct } = useGameStore();
  const [cashAmount, setCashAmount] = useState('100000');
  const [resAmount, setResAmount] = useState('10');

  if (!import.meta.env.DEV || !devMode) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-[80vh] overflow-y-auto bg-bg-surface border-2 border-orange-500 shadow-lg">
      <div className="sticky top-0 bg-bg-surface p-3 border-b-2 border-orange-500 flex items-center justify-between">
        <span className="text-orange-400 font-bold text-sm uppercase tracking-wider">Dev Panel</span>
        <button onClick={toggleDevMode} className="text-xs px-2 py-1 bg-danger hover:bg-danger/80 text-white">X</button>
      </div>

      <div className="p-3 space-y-4 text-sm">
        <DevSection title="Cash">
          <div className="flex gap-2">
            <input type="number" value={cashAmount} onChange={e => setCashAmount(e.target.value)} className="w-24 bg-bg-card border-2 border-border px-2 py-1 text-xs text-text-primary" />
            <button onClick={() => addCash(Number(cashAmount))} className="px-3 py-1 bg-profit hover:bg-green-600 text-white text-xs">Add</button>
            <button onClick={() => addCash(Number(cashAmount) * -1)} className="px-3 py-1 bg-danger hover:bg-danger/80 text-white text-xs">Sub</button>
            <button onClick={() => addCash(1_000_000_000)} className="px-3 py-1 bg-orange-600 hover:bg-orange-500 text-white text-xs">∞</button>
          </div>
          <div className="text-text-muted text-xs">Current: ${cash.toLocaleString()}</div>
        </DevSection>

        <DevSection title="Employees">
          <div className="flex flex-wrap gap-1">
            {ROLES.map(role => (
              <div key={role} className="flex gap-1">
                <button onClick={() => hireEmployee(role)} className="px-2 py-1 bg-primary hover:bg-steel text-white text-xs">
                  Hire {role.replace('_', ' ')}
                </button>
              </div>
            ))}
          </div>
          <div className="text-text-muted text-xs">{employees.length} employees</div>
          {employees.length > 0 && (
            <div className="space-y-1 mt-1">
              {employees.map(emp => (
                <div key={emp.id} className="flex items-center justify-between bg-bg-card px-2 py-1 border border-border">
                  <span className="text-xs text-text-primary">{emp.name} ({emp.role.replace('_', ' ')})</span>
                  {emp.currentTask && (
                    <button onClick={() => useGameStore.getState().completeTask(emp.id)} className="text-xs px-2 py-0.5 bg-steel hover:bg-primary text-white">
                      Finish Task
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </DevSection>

        <DevSection title="Resources">
          <div className="flex gap-2">
            <select value="" onChange={e => { if (e.target.value) { addResources(e.target.value, Number(resAmount)); } }} className="bg-bg-card border-2 border-border px-2 py-1 text-xs text-text-primary">
              <option value="">Select component...</option>
              {COMPONENTS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input type="number" value={resAmount} onChange={e => setResAmount(e.target.value)} className="w-16 bg-bg-card border-2 border-border px-2 py-1 text-xs text-text-primary" />
          </div>
          <div className="flex flex-wrap gap-2 mt-1">
            <button onClick={() => { COMPONENTS.forEach(c => addResources(c.id, 50)); }} className="px-2 py-1 bg-orange-600 hover:bg-orange-500 text-white text-xs">
              +50 All
            </button>
            <button onClick={() => { COMPONENTS.forEach(c => addResources(c.id, 500)); }} className="px-2 py-1 bg-orange-600 hover:bg-orange-500 text-white text-xs">
              +500 All
            </button>
          </div>
        </DevSection>

        <DevSection title="Features">
          <button onClick={unlockAllFeatures} disabled={!selectedProduct} className={`px-3 py-1.5 text-xs border-2 ${selectedProduct ? 'bg-primary hover:bg-steel text-white border-primary' : 'bg-bg-card text-text-muted border-border cursor-not-allowed'}`}>
            Unlock All Features (Lv.1)
          </button>
          <div className="text-text-muted text-xs">{features.filter(f => f.level > 0).length}/{features.length} built</div>
        </DevSection>

        <DevSection title="Server">
          <div className="space-y-2">
            <div className="text-xs text-text-muted">Buy rack (free):</div>
            <div className="flex flex-wrap gap-1">
              {RACK_TIERS.map(rack => (
                <button key={rack.tier} onClick={() => {
                  const prev = useGameStore.getState().cash;
                  useGameStore.getState().buyRack(rack.tier);
                  if (useGameStore.getState().cash < prev) useGameStore.getState().addCash(rack.price);
                }} className="px-2 py-1 bg-steel hover:bg-primary text-white text-xs">
                  {rack.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-xs text-text-muted">Fill rack with nodes (free):</div>
            {racks.map(rack => (
              <div key={rack.id} className="border-2 border-border bg-bg-card p-2">
                <div className="text-xs text-text-primary mb-1">{rack.label} ({rack.id})</div>
                <div className="flex flex-wrap gap-1">
                  {NODE_DEFS.map(node => (
                    <button key={node.typeId} onClick={() => fillRack(rack.id, node.typeId)} className="px-1.5 py-0.5 bg-steel hover:bg-primary text-white text-[10px]">
                      {node.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </DevSection>

        <DevSection title="Game State">
          <div className="text-xs text-text-muted space-y-1">
            <div>Tick: {useGameStore.getState().tick} | Month: {useGameStore.getState().month}</div>
            <button onClick={() => { const s = useGameStore.getState(); for (let i = 0; i < 30; i++) s.incrementTick(); }} className="px-2 py-1 bg-bg-hover hover:bg-bg-card border border-border text-xs">
              Fast-forward 30 ticks (1 month)
            </button>
          </div>
        </DevSection>
      </div>
    </div>
  );
}

function DevSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-bg-card border-2 border-border p-2">
      <div className="text-orange-400 text-xs font-semibold mb-1.5 uppercase tracking-wider">{title}</div>
      {children}
    </div>
  );
}