import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import type { EmployeeRole, SourcingCampaign, AdLead } from '../types';
import { COMPONENTS } from '../data/components';
import { NODE_DEFS, RACK_TIERS } from '../data/servers';
import { generateApplicant } from '../systems/recruitment';
import { generateSingleLead, calcFeatureAdjustedBudgetRange, calcNegotiateChance } from '../systems/adSales';
import { hasActiveSynergy } from '../systems/platform';

const ROLES: EmployeeRole[] = ['Developer', 'Designer'];

export function DevPanel() {
  const { cash, addCash, employees, hireEmployee, addResources, features, unlockAllFeatures, racks, fillRack, selectedProduct, perkPoints, unlockedPerks, unlockAllPerks, devSpawnFurniture, currentUsers, adLeads, adCampaigns, gameLog, devSpawnCompetitor, devSetMaxBrand, devResetCompetitors, devTriggerHotSector, competitors } = useGameStore();
  const [cashAmount, setCashAmount] = useState('100000');
  const [resAmount, setResAmount] = useState('10');
  const [spawnedLeads, setSpawnedLeads] = useState<AdLead[]>([]);
  const [offerBudget, setOfferBudget] = useState('29000');
  const [offerDays, setOfferDays] = useState('30');
  const [offerPrice, setOfferPrice] = useState('966');

  const unlockedLevels = features.filter(f => f.level > 0).map(f => f.level);
  const platformLevel = unlockedLevels.length > 0 ? unlockedLevels.reduce((s, l) => s + l, 0) / unlockedLevels.length : 0;
  const productFeaturesLevel = features.reduce((s, f) => s + f.level, 0);
  const synergyActive = hasActiveSynergy(features, selectedProduct);
  const specialists = employees.filter(e => e.role === 'Ad_Monetization_Specialist');
  const specLevel = specialists[0]?.level ?? 1;

  const b = Number(offerBudget), d = Number(offerDays), p = Number(offerPrice);
  const offerTotal = p * d;
  const offerChance = calcNegotiateChance(offerTotal, b);

  const budgetRange = calcFeatureAdjustedBudgetRange(currentUsers, platformLevel, productFeaturesLevel, 1, synergyActive, specLevel);

  const spawnLead = () => {
    const s = useGameStore.getState();
    const lead = generateSingleLead(
      { currentUsers: s.currentUsers, adPlatformLevel: platformLevel, dataRatio: 1, synergyActive, specialistLevel: specLevel, productFeaturesLevel },
      specialists[0]?.id ?? 'dev',
      s.adLeads.map(l => l.clientName),
      s.tick,
    );
    setSpawnedLeads(prev => [lead, ...prev].slice(0, 8));
  };

  return (
    <div className="space-y-3 text-xs">
      <DevSection title="Cash">
        <div className="flex gap-2">
          <input type="number" value={cashAmount} onChange={e => setCashAmount(e.target.value)} className="w-24 bg-surface-2 border border-border rounded-lg px-2 py-1 text-xs text-ink" />
          <button onClick={() => addCash(Number(cashAmount))} className="px-3 py-1 bg-green hover:bg-green/90 text-white rounded-lg">Add</button>
          <button onClick={() => addCash(Number(cashAmount) * -1)} className="px-3 py-1 bg-red hover:bg-red/90 text-white rounded-lg">Sub</button>
          <button onClick={() => addCash(1_000_000_000)} className="px-3 py-1 bg-amber hover:bg-amber/90 text-white rounded-lg">∞</button>
        </div>
        <div className="text-ink-soft text-[10px]">Current: ${cash.toLocaleString()}</div>
      </DevSection>

      <DevSection title="Employees">
        <div className="flex flex-wrap gap-1">
          {ROLES.map(role => (
            <button key={role} onClick={() => hireEmployee(role)} className="px-2 py-1 bg-indigo hover:bg-indigo/90 text-white rounded-lg text-[10px]">
              Hire {role.replace('_', ' ')}
            </button>
          ))}
        </div>
        <div className="text-ink-soft text-[10px]">{employees.length} employees</div>
        {employees.length > 0 && (
          <div className="space-y-1 mt-1">
            {employees.map(emp => (
              <div key={emp.id} className="flex items-center justify-between bg-surface-2 px-2 py-1 rounded-lg border border-border">
                <span className="text-[10px] text-ink">{emp.name} ({emp.role.replace('_', ' ')}) · Lv.{emp.level}</span>
                <div className="flex gap-1">
                  {emp.currentTask && (
                    <button onClick={() => useGameStore.getState().completeTask(emp.id)} className="text-[10px] px-2 py-0.5 bg-indigo hover:bg-indigo/90 text-white rounded-lg">
                      Finish
                    </button>
                  )}
                  <button onClick={() => { useGameStore.setState({ employees: useGameStore.getState().employees.map(e => e.id === emp.id ? { ...e, level: e.level + 1, trainingProgress: 0, isTraining: false } : e) }); }}
                    className="text-[10px] px-2 py-0.5 bg-amber hover:bg-amber/90 text-white rounded-lg">Lv+</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </DevSection>

      <DevSection title="Resources">
        <div className="flex gap-2">
          <select value="" onChange={e => { if (e.target.value) addResources(e.target.value, Number(resAmount)); }} className="bg-surface-2 border border-border rounded-lg px-2 py-1 text-xs text-ink">
            <option value="">Select...</option>
            {COMPONENTS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input type="number" value={resAmount} onChange={e => setResAmount(e.target.value)} className="w-16 bg-surface-2 border border-border rounded-lg px-2 py-1 text-xs text-ink" />
        </div>
        <div className="flex gap-2 mt-1">
          <button onClick={() => { COMPONENTS.forEach(c => addResources(c.id, 50)); }} className="px-2 py-1 bg-amber hover:bg-amber/90 text-white rounded-lg text-[10px]">+50 All</button>
          <button onClick={() => { COMPONENTS.forEach(c => addResources(c.id, 500)); }} className="px-2 py-1 bg-amber hover:bg-amber/90 text-white rounded-lg text-[10px]">+500 All</button>
        </div>
      </DevSection>

      <DevSection title="Features">
        <button onClick={unlockAllFeatures} disabled={!selectedProduct}
          className={`px-3 py-1.5 text-[10px] font-semibold rounded-lg ${selectedProduct ? 'bg-indigo hover:bg-indigo/90 text-white' : 'bg-surface-2 text-ink-soft border border-border cursor-not-allowed'}`}>
          Unlock All Features
        </button>
        <div className="text-ink-soft text-[10px]">{features.filter(f => f.level > 0).length}/{features.length} built</div>
      </DevSection>

      <DevSection title="Server">
        <div className="text-[10px] text-ink-soft mb-1">Buy rack (free):</div>
        <div className="flex flex-wrap gap-1 mb-2">
          {RACK_TIERS.map(rack => (
            <button key={rack.tier} onClick={() => { const prev = useGameStore.getState().cash; useGameStore.getState().buyRack(rack.tier); if (useGameStore.getState().cash < prev) useGameStore.getState().addCash(rack.price); }}
              className="px-2 py-1 bg-indigo hover:bg-indigo/90 text-white rounded-lg text-[10px]">{rack.label}</button>
          ))}
        </div>
        {racks.map(rack => (
          <div key={rack.id} className="border border-border rounded-lg p-2 bg-surface-2 mb-1">
            <div className="text-[10px] text-ink mb-1">{rack.label}</div>
            <div className="flex flex-wrap gap-1">
              {NODE_DEFS.map(node => (
                <button key={node.typeId} onClick={() => fillRack(rack.id, node.typeId)} className="px-1.5 py-0.5 bg-indigo hover:bg-indigo/90 text-white rounded text-[9px]">{node.label}</button>
              ))}
            </div>
          </div>
        ))}
      </DevSection>

      <DevSection title="Recruitment">
        <div className="flex flex-wrap gap-1">
          {(['basic', 'pro', 'headhunter'] as const).map(tier => (
            <button key={tier} onClick={() => {
              const s = useGameStore.getState();
              const campaign: SourcingCampaign = { tier, daysLeft: 0 };
              const app = generateApplicant(campaign);
              s.addNotification(`DEV: ${app.name} (${app.role.replace('_', ' ')})`, 'info');
              useGameStore.setState({ applicants: [...s.applicants, app] });
            }} className="px-2 py-1 bg-indigo hover:bg-indigo/90 text-white rounded-lg text-[10px]">
              Spawn {tier}
            </button>
          ))}
        </div>
        <div className="text-[10px] text-ink-soft mt-1">{useGameStore.getState().applicants.length} applicants</div>
      </DevSection>

      <DevSection title="Perks & Furniture">
        <div className="flex flex-wrap gap-1">
          <button onClick={() => useGameStore.setState({ perkPoints: useGameStore.getState().perkPoints + 5 })} className="px-2 py-1 bg-amber hover:bg-amber/90 text-white rounded-lg text-[10px]">+5 Perk Points</button>
          <button onClick={unlockAllPerks} className="px-2 py-1 bg-indigo hover:bg-indigo/90 text-white rounded-lg text-[10px]">Unlock All Perks</button>
          <button onClick={devSpawnFurniture} className="px-2 py-1 bg-green hover:bg-green/90 text-white rounded-lg text-[10px]">Spawn All Furniture</button>
        </div>
        <div className="text-ink-soft text-[10px] mt-1">{perkPoints} points · {unlockedPerks.length} perks unlocked</div>
      </DevSection>

      <DevSection title="Events & Market">
        <div className="flex flex-wrap gap-1">
          <button onClick={devTriggerHotSector} className="px-2 py-1 bg-amber hover:bg-amber/90 text-white rounded-lg text-[10px]">Trigger Hot Sector</button>
        </div>
      </DevSection>

      <DevSection title="Ad Sales">
        <div className="space-y-0.5 text-[10px] text-ink-soft">
          <div>Users: <span className="text-ink">{Math.round(currentUsers).toLocaleString()}</span></div>
          <div>platformLevel (mean): <span className="text-ink">{platformLevel.toFixed(2)}</span></div>
          <div>productFeaturesLevel: <span className="text-ink">{productFeaturesLevel}</span></div>
          <div>synergy: <span className="text-ink">{String(synergyActive)}</span> · specialists: <span className="text-ink">{specialists.length}</span></div>
          <div>Budget range: <span className="text-ink">${budgetRange.min.toLocaleString()}–${budgetRange.max.toLocaleString()}</span> (count {budgetRange.count})</div>
          <div>Live: {adLeads.length} leads · {adCampaigns.length} campaigns</div>
        </div>

        <div className="mt-2 text-amber font-semibold text-[10px] uppercase tracking-wider">Offer Chance Calc</div>
        <div className="flex gap-1 mt-1">
          <input value={offerBudget} onChange={e => setOfferBudget(e.target.value)} className="w-20 bg-surface-2 border border-border rounded px-1 py-0.5 text-[10px] text-ink" title="Client budget (total)" />
          <input value={offerDays} onChange={e => setOfferDays(e.target.value)} className="w-12 bg-surface-2 border border-border rounded px-1 py-0.5 text-[10px] text-ink" title="Days" />
          <input value={offerPrice} onChange={e => setOfferPrice(e.target.value)} className="w-16 bg-surface-2 border border-border rounded px-1 py-0.5 text-[10px] text-ink" title="Price/day" />
        </div>
        <div className="text-[10px] text-ink-soft mt-1">
          Total ${offerTotal.toLocaleString()} · ratio {(offerTotal / b).toFixed(2)} · chance <span className="text-ink font-semibold">{offerChance}%</span> {offerChance >= 100 ? '(within budget)' : '(above budget)'}
        </div>

        <button onClick={spawnLead} className="mt-2 px-2 py-1 bg-indigo hover:bg-indigo/90 text-white rounded-lg text-[10px]">Spawn Lead</button>
        {spawnedLeads.length > 0 && (
          <div className="mt-1 space-y-1">
            {spawnedLeads.map(l => (
              <div key={l.id} className="bg-surface-2 border border-border rounded px-2 py-1 text-[10px] text-ink-soft">
                {l.clientName}: <span className="text-ink">${l.budget.toLocaleString()}</span> · {l.defaultDays}d · expires tick {l.expiresAt}
              </div>
            ))}
          </div>
        )}
      </DevSection>

      <DevSection title="Competitor & Brand">
        <div className="flex flex-wrap gap-1">
          <button onClick={devSpawnCompetitor} className="px-2 py-1 bg-amber hover:bg-amber/90 text-white rounded-lg text-[10px]">Spawn Competitor</button>
          <button onClick={devSetMaxBrand} className="px-2 py-1 bg-green hover:bg-green/90 text-white rounded-lg text-[10px]">Max Brand</button>
          <button onClick={devResetCompetitors} className="px-2 py-1 bg-red hover:bg-red/90 text-white rounded-lg text-[10px]">Reset Competitors</button>
        </div>
        <div className="text-[10px] text-ink-soft mt-1">{competitors.length} competitors ({competitors.filter(c => !c.delisted).length} active)</div>
      </DevSection>

      <DevSection title="Game State">
        <div className="text-[10px] text-ink-soft">Tick: {useGameStore.getState().tick} | Month: {useGameStore.getState().month}</div>
        <button onClick={() => { const s = useGameStore.getState(); for (let i = 0; i < 20; i++) s.incrementTick(); }}
          className="px-2 py-1 bg-surface-2 hover:bg-surface border border-border rounded-lg text-[10px] mt-1">
          Fast-forward 1 day
        </button>
        <div className="text-amber font-semibold text-[10px] uppercase tracking-wider mt-2">Log (last 12)</div>
        <div className="space-y-0.5 mt-1 max-h-40 overflow-y-auto">
          {gameLog.slice(-12).reverse().map((m, i) => (
            <div key={i} className="text-[9px] text-ink-soft font-mono break-all">{m}</div>
          ))}
        </div>
      </DevSection>
    </div>
  );
}

function DevSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface-2 border border-border rounded-lg p-2">
      <div className="text-amber font-semibold text-[10px] uppercase tracking-wider mb-1.5">{title}</div>
      {children}
    </div>
  );
}
