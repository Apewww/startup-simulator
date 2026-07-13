import { useState, useEffect, useRef } from 'react';
import { useGameStore, TICKS_PER_DAY } from '../store/gameStore';
import { Target, Search, X, RefreshCw, TrendingUp, Send } from 'lucide-react';
import { calcNegotiateChance, getSearchCap, calcSearchDuration } from '../systems/adSales';

function fmtCash(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n}`;
}

function fmtDays(d: number): string {
  return `${d} day${d !== 1 ? 's' : ''}`;
}

export function AdSalesPanel() {
  const employees = useGameStore((s) => s.employees);
  const adLeads = useGameStore((s) => s.adLeads);
  const adCampaigns = useGameStore((s) => s.adCampaigns);
  const currentUsers = useGameStore((s) => s.currentUsers);
  const tick = useGameStore((s) => s.tick);
  const searchLeads = useGameStore((s) => s.searchLeads);
  const stopSearching = useGameStore((s) => s.stopSearching);
  const sendOffer = useGameStore((s) => s.sendOffer);
  const acceptLead = useGameStore((s) => s.acceptLead);
  const cancelLead = useGameStore((s) => s.cancelLead);
  const features = useGameStore((s) => s.features);
  const unlockedPerks = useGameStore((s) => s.unlockedPerks);
  const [negotiatingLead, setNegotiatingLead] = useState<string | null>(null);
  const [offerDays, setOfferDays] = useState(30);
  const [offerPriceStr, setOfferPriceStr] = useState('');
  const [adResult, setAdResult] = useState<{ kind: 'won' | 'lost'; text: string } | null>(null);
  const prevStatusRef = useRef<Map<string, string>>(new Map());

  const specialists = employees.filter(e => e.role === 'Ad_Monetization_Specialist');
  const adPlatformLevel = features.find(f => f.id === 'ad_platform')?.level ?? 0;
  const userTier = currentUsers >= 100_000 ? 'Enterprise' : currentUsers >= 20_000 ? 'Medium' : currentUsers >= 5_000 ? 'Small' : 'Locked';
  const hasPerk = unlockedPerks.includes('sales_auto_renew');
  const searchDuration = calcSearchDuration();

  const pendingLeads = adLeads.filter(l => l.status === 'pending');
  const activeCampaigns = adCampaigns.filter(c => c.status === 'active');
  const campaignRevenue = activeCampaigns.reduce((s, c) => s + c.revenuePerTick, 0);
  const completedCampaigns = adCampaigns.filter(c => c.status === 'completed' || c.status === 'cancelled');

  useEffect(() => {
    const currentStatus = new Map(adLeads.map(l => [l.id, l.status]));
    for (const [id, prev] of prevStatusRef.current) {
      const curr = currentStatus.get(id);
      if (!curr) continue;
      if (prev === 'pending' && curr === 'won') {
        const won = adCampaigns.find(c => c.leadId === id && c.status === 'active');
        if (won) setAdResult({ kind: 'won', text: `Deal closed with ${won.clientName}: $${won.dealValue.toLocaleString()}` });
      } else if (prev === 'pending' && curr === 'lost') {
        setAdResult({ kind: 'lost', text: 'Negotiation rejected' });
      }
    }
    prevStatusRef.current = currentStatus;
  }, [adLeads, adCampaigns]);

  useEffect(() => {
    if (!adResult) return;
    const t = setTimeout(() => setAdResult(null), 5000);
    return () => clearTimeout(t);
  }, [adResult]);

  if (currentUsers < 5_000) {
    return (
      <div className="p-3 text-xs text-ink-soft">
        Unlock Ad Sales at <span className="text-indigo font-semibold">5,000 users</span> + <span className="text-indigo font-semibold">Ad Platform Lv.3</span>.
        <br />Current: {Math.round(currentUsers).toLocaleString()} users
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-3 text-xs overflow-y-auto max-h-[70vh]">
      {/* User Tier & Platform Info */}
      <div className="flex items-center justify-between bg-surface-2 rounded-lg px-3 py-2 border border-border">
        <div className="flex items-center gap-2">
          <Target className="w-3.5 h-3.5 text-indigo" strokeWidth={2} />
          <span className="font-semibold text-ink">{userTier}</span>
          {currentUsers >= 5_000 && <span className="text-[10px] text-ink-soft">| Ad Platform Lv.{adPlatformLevel}</span>}
        </div>
        <div className="flex items-center gap-1.5 text-ink-soft">
          <TrendingUp className="w-3 h-3" strokeWidth={2} />
          <span>{fmtCash(campaignRevenue)}/tick</span>
        </div>
      </div>

      {/* Specialist Status */}
      {specialists.length === 0 ? (
        <div className="text-center text-ink-soft py-4 border border-dashed border-border rounded-lg">
          No Ad Monetization Specialist hired yet.<br />
          Hire one from the Team panel.
        </div>
      ) : (
        specialists.map(s => {
          const leadsFound = adLeads.filter(l => l.specialistId === s.id && l.status === 'pending').length;
          const cap = getSearchCap(s.level);
          const searchPct = s.currentTask === 'searching_leads' ? Math.min(100, Math.round((s.taskProgress / searchDuration) * 100)) : 0;
          const searchDays = s.currentTask === 'searching_leads' ? Math.floor(s.taskProgress / TICKS_PER_DAY) + 1 : 0;
          return (
          <div key={s.id} className="flex items-center justify-between bg-surface-2 rounded-lg px-3 py-2 border border-border">
            <div className="flex-1 min-w-0">
              <span className="font-semibold text-ink">{s.name}</span>
              <span className="text-[10px] text-ink-soft ml-2">Lv.{s.level}</span>
              <div className="flex items-center gap-1 mt-0.5">
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${s.happiness >= 60 ? 'bg-green-soft text-green' : s.happiness >= 30 ? 'bg-amber-soft text-amber' : 'bg-red-soft text-red'}`}>
                  ❤ {Math.round(s.happiness)}
                </span>
                {s.currentTask === 'searching_leads' ? (
                  <span className="text-[10px] text-ink-soft">🔍 Searching ({leadsFound}/{cap} · Day {searchDays}/3)</span>
                ) : s.currentTask === 'negotiating' ? (
                  <span className="text-[10px] text-ink-soft">💼 Negotiating...</span>
                ) : (
                  <span className="text-[10px] text-ink-soft">💤 Idle</span>
                )}
              </div>
              {/* Search progress bar */}
              {s.currentTask === 'searching_leads' && (
                <div className="mt-1 flex items-center gap-2">
                  <div className="flex-1 h-1 bg-border rounded-full overflow-hidden">
                    <div className="h-full bg-indigo rounded-full transition-all" style={{ width: `${searchPct}%` }} />
                  </div>
                  <span className="text-[9px] text-ink-soft">{leadsFound}/{cap}</span>
                </div>
              )}
            </div>
            {!s.currentTask && !s.onVacation && !s.isTraining && (
              <button
                onClick={() => searchLeads(s.id)}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo hover:bg-indigo/90 text-white rounded-[8px] transition-colors cursor-pointer text-[10px] ml-2 shrink-0"
                title="Search for advertisers (3 days)"
              >
                <Search className="w-3 h-3" strokeWidth={2} />
                Find Leads
              </button>
            )}
            {s.currentTask === 'searching_leads' && (
              <button
                onClick={() => stopSearching(s.id)}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-red hover:bg-red/90 text-white rounded-[8px] transition-colors cursor-pointer text-[10px] ml-2 shrink-0"
                title="Stop searching"
              >
                <X className="w-3 h-3" strokeWidth={2} />
                Stop
              </button>
            )}
          </div>
          );
        })
      )}

      {adResult && (
        <div className={`flex items-center gap-2 p-2 rounded-lg border text-[10px] ${adResult.kind === 'won' ? 'bg-green-soft border-green/30 text-green' : 'bg-red-soft border-red/30 text-red'}`}>
          <span className="flex-1">{adResult.text}</span>
          <button onClick={() => setAdResult(null)} className="p-0.5 hover:opacity-70 cursor-pointer"><X className="w-3 h-3" /></button>
        </div>
      )}

      {/* Active Leads — compact cards */}
      <div>
        <h4 className="text-[10px] font-semibold text-ink-soft uppercase tracking-wider mb-1.5 flex items-center gap-1">
          <Search className="w-3 h-3" strokeWidth={2} />
          Leads ({pendingLeads.length})
        </h4>
        {pendingLeads.length === 0 ? (
          <p className="text-[10px] text-ink-soft text-center py-2">No leads. Click [Find Leads].</p>
        ) : (
          <div className="flex flex-col gap-1">
            {pendingLeads.map(lead => (
              <div key={lead.id}>
                {negotiatingLead === lead.id ? (
                  <div className="bg-surface border border-indigo/30 rounded-lg p-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-ink">{lead.clientName}</span>
                      <button onClick={() => setNegotiatingLead(null)} className="p-0.5 text-ink-soft hover:text-red cursor-pointer"><X className="w-3 h-3" /></button>
                    </div>
                    <div>
                      <label className="text-[9px] text-ink-soft">Duration (days)</label>
                      <input type="range" min={7} max={180} value={offerDays} onChange={e => setOfferDays(Number(e.target.value))} className="w-full accent-indigo" />
                      <div className="flex justify-between text-[9px] text-ink-soft">
                        <span>{offerDays}d</span>
                        <span>{fmtCash((Number(offerPriceStr) || 0) * offerDays)} total</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-[9px] text-ink-soft">Price/day</label>
                      <input type="range" min={1} max={Math.max(1000, lead.budget)} step={Math.max(1, Math.round(Math.max(1000, lead.budget) / 200))}
                        value={Number(offerPriceStr) || 0} onChange={e => setOfferPriceStr(e.target.value)} className="w-full accent-indigo" />
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-[9px] text-ink-soft">$</span>
                        <input type="number" min={1} value={offerPriceStr} onChange={e => setOfferPriceStr(e.target.value)}
                          className="flex-1 bg-surface-2 border border-border rounded px-2 py-0.5 text-[10px] font-mono text-ink outline-none focus:border-indigo" />
                        <span className="text-[9px] text-ink-soft">/day</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-ink-soft">Budget {fmtCash(lead.budget)}</span>
                      <EstimatedRate price={Number(offerPriceStr) || 0} budget={lead.budget} days={offerDays} />
                    </div>
                    <div className="text-[9px] text-ink-soft">
                      ~{fmtCash(Math.round(lead.budget / offerDays))}/day · Total {fmtCash((Number(offerPriceStr) || 0) * offerDays)} / {fmtCash(lead.budget)}
                    </div>
                    <div className="flex justify-end">
                      <button onClick={() => { sendOffer(lead.id, offerDays, Number(offerPriceStr) || 0); setNegotiatingLead(null); }}
                        disabled={!offerPriceStr || Number(offerPriceStr) <= 0 || offerDays < 7}
                        className="flex items-center gap-1 px-2.5 py-1 bg-indigo hover:bg-indigo/90 disabled:opacity-40 text-white rounded-[6px] text-[10px] cursor-pointer">
                        <Send className="w-3 h-3" strokeWidth={2} /> Send Offer
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 bg-surface-2 rounded-lg px-2.5 py-1.5 border border-border">
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-semibold text-ink truncate">{lead.clientName}</div>
                      <div className="text-[9px] text-ink-soft">{fmtCash(lead.budget)} · {fmtDays(lead.defaultDays)} · {fmtCash(Math.round(lead.budget / lead.defaultDays))}/d</div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[9px] text-ink-soft">⏳{Math.max(0, Math.ceil((lead.expiresAt - tick) / TICKS_PER_DAY))}d</span>
                      <button onClick={() => acceptLead(lead.id)} className="px-1.5 py-1 bg-green hover:bg-green/90 text-white rounded-[4px] text-[9px] cursor-pointer">Accept</button>
                      <button onClick={() => { setNegotiatingLead(lead.id); setOfferDays(lead.defaultDays); setOfferPriceStr(String(Math.max(1, Math.floor(lead.budget / lead.defaultDays)))); }}
                        className="px-1.5 py-1 bg-indigo hover:bg-indigo/90 text-white rounded-[4px] text-[9px] cursor-pointer">Negotiate</button>
                      <button onClick={() => cancelLead(lead.id)} className="p-1 text-ink-soft hover:text-red cursor-pointer"><X className="w-2.5 h-2.5" /></button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Campaigns */}
      <div>
        <h4 className="text-[10px] font-semibold text-ink-soft uppercase tracking-wider mb-1.5 flex items-center gap-1">
          <TrendingUp className="w-3 h-3" strokeWidth={2} />
          Active Campaigns ({activeCampaigns.length})
        </h4>
        {activeCampaigns.length === 0 ? (
          <p className="text-[10px] text-ink-soft text-center py-2">No active campaigns.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {activeCampaigns.map(c => {
              const pct = Math.round((c.ticksElapsed / c.totalTicks) * 100);
              return (
                <div key={c.id} className="bg-surface-2 rounded-lg px-3 py-2 border border-border">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-ink">{c.clientName}</span>
                    <span className="text-[10px] text-indigo font-semibold">{fmtCash(c.revenuePerTick)}/tick</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-[10px] text-ink-soft">
                    <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                      <div className="h-full bg-indigo rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="whitespace-nowrap">{Math.round(c.ticksElapsed / TICKS_PER_DAY)} / {Math.round(c.totalTicks / TICKS_PER_DAY)} days</span>
                  </div>
                  {hasPerk && <span className="text-[9px] text-amber">Auto-renew ready</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Completed Campaigns */}
      {completedCampaigns.length > 0 && (
        <div>
          <h4 className="text-[10px] font-semibold text-ink-soft uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <RefreshCw className="w-3 h-3" strokeWidth={2} />
            History ({completedCampaigns.length})
            <span className="ml-auto text-[9px]">{fmtCash(completedCampaigns.reduce((s, c) => s + c.dealValue, 0))} lifetime</span>
          </h4>
          <div className="flex flex-col gap-1">
            {completedCampaigns.slice(-5).map(c => (
              <div key={c.id} className="flex items-center justify-between text-[10px] text-ink-soft bg-surface-2 rounded-lg px-3 py-1.5 border border-border">
                <span>{c.clientName}</span>
                <span className="text-ink">{fmtCash(c.dealValue)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const CHANCE_COLORS = ['#D1453B', '#E8844A', '#B7791F', '#4F5EFF', '#17A366'];

function EstimatedRate({ price, budget, days }: { price: number; budget: number; days: number }) {
  const total = price * days;
  const chance = calcNegotiateChance(total, budget);
  const idx = chance < 20 ? 0 : chance < 60 ? 1 : chance < 100 ? 2 : 3;
  const label = chance >= 100 ? '100%' : chance >= 90 ? `${chance}%` : chance >= 50 ? `${chance}%` : `${chance}%`;
  return (
    <div className="flex items-center gap-1.5" title={total <= budget ? 'Within budget — guaranteed accept' : `Above budget — ${chance}% accept chance`}>
      <div className="w-14 h-1.5 bg-border rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, chance)}%`, backgroundColor: CHANCE_COLORS[idx] }} />
      </div>
      <span className="text-[9px] font-semibold" style={{ color: CHANCE_COLORS[idx] }}>{label}</span>
    </div>
  );
}

export const adSalesPanelMeta = {
  title: 'Ad Sales',
  icon: <Target className="w-4 h-4 text-indigo" />,
  accent: '#4F5EFF',
};
