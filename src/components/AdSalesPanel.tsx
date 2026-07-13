import { useState, useEffect, useRef } from 'react';
import { useGameStore, TICKS_PER_DAY } from '../store/gameStore';
import { Target, Search, X, RefreshCw, TrendingUp, Send } from 'lucide-react';
import { calcOfferChance } from '../systems/adSales';

function fmtCash(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n}`;
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
  const cancelLead = useGameStore((s) => s.cancelLead);
  const features = useGameStore((s) => s.features);
  const unlockedPerks = useGameStore((s) => s.unlockedPerks);
  const [negotiatingLead, setNegotiatingLead] = useState<string | null>(null);
  const [offerDays, setOfferDays] = useState(30);
  const [offerPriceStr, setOfferPriceStr] = useState('');
  const [adResult, setAdResult] = useState<{ kind: 'won' | 'lost'; text: string } | null>(null);
  const prevPendingRef = useRef<Set<string>>(new Set());

  const specialists = employees.filter(e => e.role === 'Ad_Monetization_Specialist');
  const adPlatformLevel = features.find(f => f.id === 'ad_platform')?.level ?? 0;
  const userTier = currentUsers >= 100_000 ? 'Enterprise' : currentUsers >= 20_000 ? 'Medium' : currentUsers >= 5_000 ? 'Small' : 'Locked';
  const hasPerk = unlockedPerks.includes('sales_auto_renew');

  const pendingLeads = adLeads.filter(l => l.status === 'pending');
  const activeCampaigns = adCampaigns.filter(c => c.status === 'active');
  const campaignRevenue = activeCampaigns.reduce((s, c) => s + c.revenuePerTick, 0);
  const completedCampaigns = adCampaigns.filter(c => c.status === 'completed' || c.status === 'cancelled');

  useEffect(() => {
    const currentPending = new Set(adLeads.filter(l => l.status === 'pending').map(l => l.id));
    for (const id of prevPendingRef.current) {
      if (currentPending.has(id)) continue;
      const won = adCampaigns.find(c => c.leadId === id && c.status === 'active');
      if (won) setAdResult({ kind: 'won', text: `Deal closed with ${won.clientName}: $${won.dealValue.toLocaleString()}` });
      else setAdResult({ kind: 'lost', text: 'Negotiation rejected' });
    }
    prevPendingRef.current = currentPending;
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
          return (
          <div key={s.id} className="flex items-center justify-between bg-surface-2 rounded-lg px-3 py-2 border border-border">
            <div>
              <span className="font-semibold text-ink">{s.name}</span>
              <span className="text-[10px] text-ink-soft ml-2">Lv.{s.level}</span>
              <div className="flex items-center gap-1 mt-0.5">
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${s.happiness >= 60 ? 'bg-green-soft text-green' : s.happiness >= 30 ? 'bg-amber-soft text-amber' : 'bg-red-soft text-red'}`}>
                  ❤ {Math.round(s.happiness)}
                </span>
                <span className="text-[10px] text-ink-soft">{s.currentTask === 'searching_leads' ? `🔍 Searching (${leadsFound} found)` : s.currentTask === 'negotiating' ? '💼 Negotiating...' : '💤 Idle'}</span>
              </div>
            </div>
            {!s.currentTask && !s.onVacation && !s.isTraining && (
              <button
                onClick={() => searchLeads(s.id)}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo hover:bg-indigo/90 text-white rounded-[8px] transition-colors cursor-pointer text-[10px]"
                title="Find new advertisers"
              >
                <Search className="w-3 h-3" strokeWidth={2} />
                Find Leads
              </button>
            )}
            {s.currentTask === 'searching_leads' && (
              <button
                onClick={() => stopSearching(s.id)}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-red hover:bg-red/90 text-white rounded-[8px] transition-colors cursor-pointer text-[10px]"
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

      {/* Active Leads */}
      <div>
        <h4 className="text-[10px] font-semibold text-ink-soft uppercase tracking-wider mb-1.5 flex items-center gap-1">
          <Search className="w-3 h-3" strokeWidth={2} />
          Active Leads ({pendingLeads.length})
        </h4>
        {pendingLeads.length === 0 ? (
          <p className="text-[10px] text-ink-soft text-center py-2">No leads. Click [Find Leads].</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {pendingLeads.map(lead => (
              <div key={lead.id}>
                {/* Lead summary (always visible) */}
                <div className="flex items-center justify-between bg-surface-2 rounded-lg px-3 py-2 border border-border">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-ink truncate">{lead.clientName}</div>
                    <div className="flex items-center gap-2 text-[10px] text-ink-soft">
                      <span>{fmtCash(lead.budget)}</span>
                      <span className={`px-1 py-0.5 rounded-full text-[9px] ${lead.matchPercent >= 60 ? 'bg-green-soft text-green' : lead.matchPercent >= 40 ? 'bg-amber-soft text-amber' : 'bg-red-soft text-red'}`}>
                        Match {lead.matchPercent}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                     <span className="text-[9px] text-ink-soft whitespace-nowrap">⏳ {Math.max(0, Math.ceil((lead.expiresAt - tick) / TICKS_PER_DAY))}d</span>
                    {negotiatingLead !== lead.id ? (
                      <>
                        <button
                          onClick={() => {
                            setNegotiatingLead(lead.id);
                            setOfferDays(30);
                            const suggested = Math.floor(lead.budget / 30);
                            const price = suggested * 30 >= lead.budget ? suggested - 1 : suggested;
                            setOfferPriceStr(String(Math.max(1, price)));
                          }}
                          className="px-2 py-1 bg-indigo hover:bg-indigo/90 text-white rounded-[6px] transition-colors cursor-pointer text-[10px]"
                          title="Start negotiation"
                        >
                          Negotiate
                        </button>
                        <button
                          onClick={() => cancelLead(lead.id)}
                          className="p-1 text-ink-soft hover:text-red transition-colors cursor-pointer"
                          title="Skip lead"
                        >
                          <X className="w-3 h-3" strokeWidth={2} />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setNegotiatingLead(null)}
                        className="p-1 text-ink-soft hover:text-red transition-colors cursor-pointer"
                        title="Cancel"
                      >
                        <X className="w-3 h-3" strokeWidth={2} />
                      </button>
                    )}
                  </div>
                </div>
                {/* Offer form (visible when negotiating) */}
                {negotiatingLead === lead.id && (
                  <div className="mt-1 bg-surface border border-indigo/30 rounded-lg px-3 py-2.5 space-y-2">
                    <div>
                      <label className="text-[10px] text-ink-soft font-semibold">Duration (days)</label>
                      <input
                        type="range"
                        min={7}
                        max={180}
                        value={offerDays}
                        onChange={(e) => setOfferDays(Number(e.target.value))}
                        className="w-full accent-indigo"
                      />
                      <div className="flex justify-between text-[9px] text-ink-soft">
                        <span>{offerDays} days</span>
                        <span>{fmtCash((Number(offerPriceStr) || 0) * offerDays)} total</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-ink-soft font-semibold">Price per day</label>
                      <input
                        type="range"
                        min={1}
                        max={Math.max(1000, lead.budget)}
                        step={Math.max(1, Math.round(Math.max(1000, lead.budget) / 200))}
                        value={Number(offerPriceStr) || 0}
                        onChange={(e) => setOfferPriceStr(e.target.value)}
                        className="w-full accent-indigo"
                      />
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-[10px] text-ink-soft">$</span>
                        <input
                          type="number"
                          min={1}
                          value={offerPriceStr}
                          onChange={(e) => setOfferPriceStr(e.target.value)}
                          className="flex-1 bg-surface-2 border border-border rounded-[6px] px-2 py-1 text-xs font-mono text-ink outline-none focus:border-indigo"
                        />
                        <span className="text-[10px] text-ink-soft">/day</span>
                      </div>
                    </div>
                     <div className="flex items-center gap-2">
                       <span className="text-[9px] text-ink-soft whitespace-nowrap">Budget: {fmtCash(lead.budget)}</span>
                       <EstimatedRate
                         price={Number(offerPriceStr) || 0}
                         budget={lead.budget}
                         days={offerDays}
                       />
                     </div>
                     <div className="text-[9px] text-ink-soft">
                       Saran ~{fmtCash(Math.round(lead.budget / offerDays))}/day (budget ÷ hari) · Total {fmtCash((Number(offerPriceStr) || 0) * offerDays)} / {fmtCash(lead.budget)}
                     </div>
                    <div className="flex justify-end">
                      <button
                        onClick={() => {
                          const price = Number(offerPriceStr) || 0;
                          sendOffer(lead.id, offerDays, price);
                          setNegotiatingLead(null);
                        }}
                        disabled={!offerPriceStr || Number(offerPriceStr) <= 0 || offerDays < 7}
                        className="flex items-center gap-1 px-3 py-1.5 bg-indigo hover:bg-indigo/90 disabled:opacity-40 text-white rounded-[6px] transition-colors cursor-pointer text-[10px]"
                      >
                        <Send className="w-3 h-3" strokeWidth={2} />
                        Send Offer
                      </button>
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
  const features = useGameStore((s) => s.features);
  const currentUsers = useGameStore((s) => s.currentUsers);
  const total = price * days;
  const unlocked = features.filter((f) => f.level > 0).map((f) => f.level);
  const meanLevel = unlocked.length > 0 ? unlocked.reduce((s, l) => s + l, 0) / unlocked.length : 0;
  const platformBonus = (currentUsers * 0.00001 + meanLevel * 0.05) * 20;
  const chance = Math.max(10, Math.min(100, Math.round(calcOfferChance(total, budget) + platformBonus)));
  const idx = chance < 20 ? 0 : chance < 40 ? 1 : chance < 60 ? 2 : chance < 80 ? 3 : 4;
  return (
    <div className="flex items-center gap-1.5" title={`Estimated: ${chance}% — adjust price/days to improve`}>
      <div className="w-14 h-1.5 bg-border rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${chance}%`, backgroundColor: CHANCE_COLORS[idx] }} />
      </div>
      <span className="text-[9px] font-semibold" style={{ color: CHANCE_COLORS[idx] }}>{chance}%</span>
    </div>
  );
}

export const adSalesPanelMeta = {
  title: 'Ad Sales',
  icon: <Target className="w-4 h-4 text-indigo" />,
  accent: '#4F5EFF',
};
