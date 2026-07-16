import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { TICKS_PER_DAY, TICKS_PER_MONTH } from '../constants';
import type { EmployeeRole, SourcingCampaign, AdLead } from '../types';
import { COMPONENTS } from '../data/components';
import { NODE_DEFS, RACK_TIERS } from '../data/servers';
import { generateApplicant } from '../systems/recruitment';
import { generateSingleLead, calcFeatureAdjustedBudgetRange, calcNegotiateChance } from '../systems/adSales';
import { hasActiveSynergy } from '../systems/platform';

const ROLES: EmployeeRole[] = ['Developer', 'Designer'];

type DevTab = 'core' | 'team' | 'server' | 'market' | 'state';

const TABS: { id: DevTab; label: string }[] = [
  { id: 'core', label: 'Core' },
  { id: 'team', label: 'Team' },
  { id: 'server', label: 'Server' },
  { id: 'market', label: 'Market' },
  { id: 'state', label: 'State' },
];

export function DevPanel() {
  const [tab, setTab] = useState<DevTab>('core');
  const { cash, addCash, employees, hireEmployee, addResources, features, unlockAllFeatures, racks, fillRack, selectedProduct, perkPoints, unlockedPerks, unlockAllPerks, devSpawnFurniture, currentUsers, adLeads, adCampaigns, gameLog, devSpawnCompetitor, devSetMaxBrand, devResetCompetitors, devTriggerHotSector, competitors, skipTicks } = useGameStore();
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
    <div>
      {/* Tabs */}
      <div className="flex gap-1 mb-3 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-2.5 py-1 text-[10px] font-semibold rounded-lg transition-colors cursor-pointer shrink-0 ${
              tab === t.id ? 'bg-amber text-white' : 'bg-surface-2 text-ink-soft hover:text-ink'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="space-y-3 text-xs">
        {tab === 'core' && (
          <>
            <DevSection title="Cash">
              <div className="flex gap-2">
                <input type="number" value={cashAmount} onChange={e => setCashAmount(e.target.value)} className="w-20 bg-surface-2 border border-border rounded-lg px-2 py-1 text-xs text-ink" />
                <button onClick={() => addCash(Number(cashAmount))} className="px-2 py-1 bg-green hover:bg-green/90 text-white rounded-lg text-[10px]">Add</button>
                <button onClick={() => addCash(Number(cashAmount) * -1)} className="px-2 py-1 bg-red hover:bg-red/90 text-white rounded-lg text-[10px]">Sub</button>
                <button onClick={() => addCash(1_000_000_000)} className="px-2 py-1 bg-amber hover:bg-amber/90 text-white rounded-lg text-[10px]">∞</button>
              </div>
              <div className="text-ink-soft text-[10px] mt-1">Cash: ${cash.toLocaleString()}</div>
            </DevSection>

            <DevSection title="Resources">
              <div className="flex gap-2">
                <select value="" onChange={e => { if (e.target.value) addResources(e.target.value, Number(resAmount)); }} className="bg-surface-2 border border-border rounded-lg px-2 py-1 text-xs text-ink">
                  <option value="">Select...</option>
                  {COMPONENTS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <input type="number" value={resAmount} onChange={e => setResAmount(e.target.value)} className="w-14 bg-surface-2 border border-border rounded-lg px-2 py-1 text-xs text-ink" />
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
              <div className="text-ink-soft text-[10px] mt-1">{features.filter(f => f.level > 0).length}/{features.length} built</div>
            </DevSection>
          </>
        )}

        {tab === 'team' && (
          <>
            <DevSection title="Hire">
              <div className="flex flex-wrap gap-1">
                {ROLES.map(role => (
                  <button key={role} onClick={() => hireEmployee(role)} className="px-2 py-1 bg-indigo hover:bg-indigo/90 text-white rounded-lg text-[10px]">
                    Hire {role.replace('_', ' ')}
                  </button>
                ))}
              </div>
              <div className="text-ink-soft text-[10px] mt-1">{employees.length} employees</div>
            </DevSection>

            {employees.length > 0 && (
              <DevSection title="Employee Actions">
                {employees.map(emp => (
                  <div key={emp.id} className="flex items-center justify-between bg-surface-2 px-2 py-1 rounded-lg border border-border mb-1">
                    <span className="text-[10px] text-ink">{emp.name} ({emp.role.replace('_', ' ')}) · Lv.{emp.level}</span>
                    <div className="flex gap-1">
                      {emp.currentTask && (
                        <button onClick={() => useGameStore.getState().completeTask(emp.id)} className="text-[10px] px-2 py-0.5 bg-indigo hover:bg-indigo/90 text-white rounded-lg">Finish</button>
                      )}
                      <button onClick={() => { useGameStore.setState({ employees: useGameStore.getState().employees.map(e => e.id === emp.id ? { ...e, level: e.level + 1, trainingProgress: 0, isTraining: false } : e) }); }}
                        className="text-[10px] px-2 py-0.5 bg-amber hover:bg-amber/90 text-white rounded-lg">Lv+</button>
                    </div>
                  </div>
                ))}
              </DevSection>
            )}

            <DevSection title="Recruitment">
              <div className="flex flex-wrap gap-1">
                {(['basic', 'pro', 'headhunter'] as const).map(tier => (
                  <button key={tier} onClick={() => {
                    const s = useGameStore.getState();
                    const campaign: SourcingCampaign = { tier, daysLeft: 0 };
                    const app = generateApplicant(campaign);
                    s.addNotification(`DEV: ${app.name} (${app.role.replace('_', ' ')})`, 'info');
                    useGameStore.setState({ applicants: [...s.applicants, app] });
                  }} className="px-2 py-1 bg-indigo hover:bg-indigo/90 text-white rounded-lg text-[10px]">Spawn {tier}</button>
                ))}
              </div>
            </DevSection>
          </>
        )}

        {tab === 'server' && (
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
        )}

        {tab === 'market' && (
          <>
            <DevSection title="Ad Sales">
              <div className="space-y-0.5 text-[10px] text-ink-soft">
                <div>Users: <span className="text-ink">{Math.round(currentUsers).toLocaleString()}</span></div>
                <div>platformLevel: <span className="text-ink">{platformLevel.toFixed(2)}</span></div>
                <div>Budget range: <span className="text-ink">${budgetRange.min.toLocaleString()}–${budgetRange.max.toLocaleString()}</span></div>
                <div>Live: {adLeads.length} leads · {adCampaigns.length} campaigns</div>
              </div>
              <div className="mt-2 flex gap-1">
                <input value={offerBudget} onChange={e => setOfferBudget(e.target.value)} className="w-16 bg-surface-2 border border-border rounded px-1 py-0.5 text-[10px] text-ink" placeholder="Budget" />
                <input value={offerDays} onChange={e => setOfferDays(e.target.value)} className="w-10 bg-surface-2 border border-border rounded px-1 py-0.5 text-[10px] text-ink" placeholder="Days" />
                <input value={offerPrice} onChange={e => setOfferPrice(e.target.value)} className="w-14 bg-surface-2 border border-border rounded px-1 py-0.5 text-[10px] text-ink" placeholder="Price" />
              </div>
              <div className="text-[10px] text-ink-soft mt-1">Total ${offerTotal.toLocaleString()} · chance <span className="text-ink font-semibold">{offerChance}%</span></div>
              <button onClick={spawnLead} className="mt-2 px-2 py-1 bg-indigo hover:bg-indigo/90 text-white rounded-lg text-[10px]">Spawn Lead</button>
              {spawnedLeads.length > 0 && (
                <div className="mt-1 space-y-1">
                  {spawnedLeads.map(l => (
                    <div key={l.id} className="bg-surface-2 border border-border rounded px-2 py-1 text-[10px] text-ink-soft">
                      {l.clientName}: ${l.budget.toLocaleString()} · {l.defaultDays}d
                    </div>
                  ))}
                </div>
              )}
            </DevSection>

            <DevSection title="Competitor & Brand">
              <div className="flex flex-wrap gap-1">
                <button onClick={devSpawnCompetitor} className="px-2 py-1 bg-amber hover:bg-amber/90 text-white rounded-lg text-[10px]">Spawn Competitor</button>
                <button onClick={devSetMaxBrand} className="px-2 py-1 bg-green hover:bg-green/90 text-white rounded-lg text-[10px]">Max Brand</button>
                <button onClick={devResetCompetitors} className="px-2 py-1 bg-red hover:bg-red/90 text-white rounded-lg text-[10px]">Reset</button>
              </div>
              <div className="text-[10px] text-ink-soft mt-1">{competitors.length} competitors ({competitors.filter(c => !c.delisted).length} active)</div>
            </DevSection>

            <DevSection title="Events">
              <button onClick={devTriggerHotSector} className="px-2 py-1 bg-amber hover:bg-amber/90 text-white rounded-lg text-[10px]">Trigger Hot Sector</button>
            </DevSection>
          </>
        )}

        {tab === 'state' && (
          <>
            <DevSection title="Perks & Furniture">
              <div className="flex flex-wrap gap-1">
                <button onClick={() => useGameStore.setState({ perkPoints: useGameStore.getState().perkPoints + 5 })} className="px-2 py-1 bg-amber hover:bg-amber/90 text-white rounded-lg text-[10px]">+5 Points</button>
                <button onClick={unlockAllPerks} className="px-2 py-1 bg-indigo hover:bg-indigo/90 text-white rounded-lg text-[10px]">Unlock All</button>
                <button onClick={devSpawnFurniture} className="px-2 py-1 bg-green hover:bg-green/90 text-white rounded-lg text-[10px]">Spawn Furniture</button>
              </div>
              <div className="text-ink-soft text-[10px] mt-1">{perkPoints} points · {unlockedPerks.length} perks</div>
            </DevSection>

            <DevSection title="R&D / Tech Tree">
              <div className="flex flex-wrap gap-1">
                <button onClick={() => {
                  const state = useGameStore.getState();
                  const allIds = ['efficient_coding','ui_framework','ad_optimization','distributed_systems','user_analytics','programmatic_ads','edge_computing','recommendation_engine','subscription_plus','quantum_crawler','ai_personalization','market_intelligence'];
                  state.unlockedTechs.forEach(id => { if (!allIds.includes(id)) allIds.push(id); });
                  useGameStore.setState({ unlockedTechs: allIds });
                }} className="px-2 py-1 bg-indigo hover:bg-indigo/90 text-white rounded-lg text-[10px]">Unlock All</button>
                <button onClick={() => useGameStore.setState({ activeResearch: null, employees: useGameStore.getState().employees.map(e => e.currentTask?.startsWith('research:') ? { ...e, currentTask: null, taskProgress: 0 } : e) })}
                  className="px-2 py-1 bg-amber hover:bg-amber/90 text-white rounded-lg text-[10px]">Cancel Research</button>
              </div>
              <div className="text-ink-soft text-[10px] mt-1">{useGameStore.getState().unlockedTechs.length} techs unlocked</div>
            </DevSection>

            <DevSection title="Investor Relations">
              <div className="flex flex-wrap gap-1">
                <button onClick={() => useGameStore.setState({ boardSatisfaction: Math.min(100, useGameStore.getState().boardSatisfaction + 20) })}
                  className="px-2 py-1 bg-green hover:bg-green/90 text-white rounded-lg text-[10px]">+20 Satisfaction</button>
                <button onClick={() => useGameStore.setState({ boardSatisfaction: Math.max(0, useGameStore.getState().boardSatisfaction - 20) })}
                  className="px-2 py-1 bg-red hover:bg-red/90 text-white rounded-lg text-[10px]">-20 Satisfaction</button>
                <button onClick={async () => {
                  const state = useGameStore.getState();
                  if (state.quarterlyTargets.length === 0 && state.month > 0) {
                    const { generateQuarterlyTargets: gen } = await import('../systems/investorRelations');
                    const targets = gen(state.currentQuarter, state.currentUsers || 10000, 5000, 50, 0.5, 100);
                    useGameStore.setState({ quarterlyTargets: targets });
                  }
                }} className="px-2 py-1 bg-amber hover:bg-amber/90 text-white rounded-lg text-[10px]">Gen Targets</button>
              </div>
              <div className="text-ink-soft text-[10px] mt-1">{useGameStore.getState().boardSatisfaction}% satisfaction</div>
            </DevSection>

            <DevSection title="Wealth">
              <div className="flex flex-wrap gap-1">
                <button onClick={() => useGameStore.setState({ personalCash: useGameStore.getState().personalCash + 1000000 })}
                  className="px-2 py-1 bg-green hover:bg-green/90 text-white rounded-lg text-[10px]">+$1M Personal</button>
                <button onClick={() => {
                  const ach = ['hustler','founder','tycoon','mogul','millionaire','multi_millionaire','billionaire'];
                  useGameStore.setState({ unlockedTitles: ach, personalCash: 1_000_000_000 });
                }} className="px-2 py-1 bg-indigo hover:bg-indigo/90 text-white rounded-lg text-[10px]">Unlock All Titles</button>
              </div>
              <div className="text-ink-soft text-[10px] mt-1">{useGameStore.getState().unlockedTitles.length} titles</div>
            </DevSection>

            <DevSection title="Game State">
              <div className="text-[10px] text-ink-soft">Tick: {useGameStore.getState().tick} | Month: {useGameStore.getState().month}</div>
              <div className="flex gap-1 mt-1">
                <button onClick={() => skipTicks(TICKS_PER_DAY)} className="px-2 py-1 bg-surface-2 hover:bg-surface border border-border rounded-lg text-[10px] cursor-pointer">Day</button>
                <button onClick={() => skipTicks(TICKS_PER_DAY * 7)} className="px-2 py-1 bg-surface-2 hover:bg-surface border border-border rounded-lg text-[10px] cursor-pointer">Week</button>
                <button onClick={() => skipTicks(TICKS_PER_MONTH)} className="px-2 py-1 bg-surface-2 hover:bg-surface border border-border rounded-lg text-[10px] cursor-pointer">Month</button>
                <button onClick={() => skipTicks(TICKS_PER_MONTH * 12)} className="px-2 py-1 bg-surface-2 hover:bg-surface border border-border rounded-lg text-[10px] cursor-pointer">Year</button>
              </div>
              <div className="text-amber font-semibold text-[10px] uppercase tracking-wider mt-2">Log</div>
              <div className="space-y-0.5 mt-1 max-h-32 overflow-y-auto">
                {gameLog.slice(-12).reverse().map((m, i) => (
                  <div key={i} className="text-[9px] text-ink-soft font-mono break-all">{m}</div>
                ))}
              </div>
            </DevSection>
          </>
        )}
      </div>
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
