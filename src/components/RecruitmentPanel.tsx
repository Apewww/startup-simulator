import { useState } from 'react';
import { UserCheck, Clock, X, User, Send, MessageSquare, CheckCircle, XCircle, Users as UsersIcon } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { TICKS_PER_DAY } from '../constants';
import { CAMPAIGN_COST, getCampaignTicks } from '../systems/recruitment';

function formatCash(n: number): string {
  return `$${n.toLocaleString('en-US')}`;
}

interface NegotiationState {
  applicantId: string;
  message: string;
  result: 'pending' | 'hired' | 'rejected' | 'countered';
  newSalary?: number;
}

export function RecruitmentPanel() {
  const { cash, employees, sourcingCampaign, applicants, selectedHrId, startSourcing, cancelSourcing, negotiateSalary, dismissApplicant, setSelectedHr } = useGameStore();
  const [negotiatingId, setNegotiatingId] = useState<string | null>(null);
  const [offerInput, setOfferInput] = useState('');
  const [negoResult, setNegoResult] = useState<NegotiationState | null>(null);

  const activeApplicants = applicants.filter(a => a.status !== 'hired');
  const hrEmployees = employees.filter(e => e.role === 'HR');
  const selectedHr = employees.find(e => e.id === selectedHrId);
  const hrLevel = selectedHr?.role === 'HR' ? selectedHr.level : 0;
  const hrSpeed = selectedHr?.role === 'HR' ? selectedHr.speed : 0;

  const startNegotiate = (id: string, expectedSalary: number) => {
    setNegotiatingId(id);
    setOfferInput(String(expectedSalary));
    setNegoResult(null);
  };

  const handleOffer = (appId: string) => {
    const app = applicants.find(a => a.id === appId);
    if (!app) return;
    negotiateSalary(appId, Number(offerInput));
    const updated = useGameStore.getState().applicants.find(a => a.id === appId);
    if (!updated) return;

    if (updated.status === 'hired') {
      setNegoResult({ applicantId: appId, message: 'Deal! When do I start?', result: 'hired' });
      setTimeout(() => { setNegotiatingId(null); setNegoResult(null); }, 2000);
    } else if (updated.status === 'rejected') {
      setNegoResult({ applicantId: appId, message: 'No deal. Good luck.', result: 'rejected' });
    } else {
      const msg = updated.negotiationRounds >= (updated.mood === 'patient' ? 4 : updated.mood === 'stubborn' ? 2 : 1)
        ? 'Tired of negotiating. Goodbye.'
        : updated.expectedSalary < app.expectedSalary
          ? updated.mood === 'patient'
            ? 'How about we meet in the middle?'
            : updated.mood === 'stubborn'
              ? 'I can come down a little. That\'s my final.'
              : 'Fine... I\'ll lower it a bit.'
          : 'Too low. My price stands.';
      setNegoResult({ applicantId: appId, message: msg, result: 'countered', newSalary: updated.expectedSalary });
      setOfferInput(String(updated.expectedSalary));
    }
  };

  return (
    <div className="space-y-3">
      {/* HR Lead Selector */}
      <div className="card p-3">
        <div className="flex items-center gap-1.5 mb-2">
          <UsersIcon className="w-3.5 h-3.5 text-indigo" />
          <span className="text-[11px] font-bold text-ink">HR Lead</span>
        </div>
        <select value={selectedHrId ?? ''} onChange={e => setSelectedHr(e.target.value || null)}
          className="w-full bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-[11px] text-ink font-semibold cursor-pointer outline-none focus:border-indigo">
          <option value="">No HR assigned</option>
          {hrEmployees.map(e => (
            <option key={e.id} value={e.id}>{e.name} (Lv.{e.level} · {e.speed.toFixed(1)}x)</option>
          ))}
        </select>
        {hrLevel > 0 && (
          <div className="mt-1.5 text-[9px] text-green font-semibold">
            Campaign speed boost: Lv.{hrLevel} × 30 + {Math.floor(hrSpeed * 10)} = {hrLevel * 30 + Math.floor(hrSpeed * 10)} ticks reduction
          </div>
        )}
      </div>

      {/* Sourcing Campaign */}
      <div className="card p-3">
        <div className="flex items-center gap-1.5 mb-2">
          <Clock className="w-3.5 h-3.5 text-indigo" />
          <span className="text-[11px] font-bold text-ink">Sourcing Campaign</span>
        </div>

        {sourcingCampaign ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-ink capitalize">{sourcingCampaign.tier} campaign</span>
              <span className="text-[10px] text-ink-soft font-mono">{Math.ceil(sourcingCampaign.daysLeft / TICKS_PER_DAY)}d left</span>
            </div>
            <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
              <div className="h-full bg-indigo rounded-full transition-all duration-300"
                style={{ width: `${((getCampaignTicks(sourcingCampaign.tier, hrLevel, hrSpeed) - sourcingCampaign.daysLeft) / getCampaignTicks(sourcingCampaign.tier, hrLevel, hrSpeed)) * 100}%` }} />
            </div>
            <button onClick={cancelSourcing} className="text-[10px] text-red hover:text-red/80 transition-colors cursor-pointer">Cancel</button>
          </div>
        ) : (
          <div className="space-y-1.5">
            {(['basic', 'pro', 'headhunter'] as const).map((tier) => {
              const cost = CAMPAIGN_COST[tier];
              const canAfford = cash >= cost;
              const ticks = getCampaignTicks(tier, hrLevel, hrSpeed);
              const reqLevel = tier === 'basic' ? 0 : tier === 'pro' ? 2 : 3;
              const hasHrReq = hrLevel >= reqLevel;
              const canStart = canAfford && hasHrReq;
              return (
                <button key={tier} onClick={() => canStart && startSourcing(tier)} disabled={!canStart}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                    canStart ? 'bg-surface-2 border border-border hover:border-indigo text-ink' : 'bg-surface-2 border border-border opacity-50 cursor-not-allowed text-ink-soft'
                  }`}>
                  <div className="flex items-center gap-2">
                    <span className="capitalize">{tier}</span>
                    <span className="text-[9px] text-ink-soft font-normal">{Math.ceil(ticks / TICKS_PER_DAY)}d</span>
                    {!hasHrReq && <span className="text-[8px] text-red font-semibold">Requires HR Lv.{reqLevel}</span>}
                  </div>
                  <span className="font-mono text-[10px]">{cost === 0 ? 'Free' : formatCash(cost)}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Applicant List */}
      <div className="card p-3">
        <div className="flex items-center gap-1.5 mb-2">
          <User className="w-3.5 h-3.5 text-indigo" />
          <span className="text-[11px] font-bold text-ink">Applicants ({activeApplicants.length})</span>
        </div>

        {activeApplicants.length === 0 ? (
          <p className="text-[10px] text-ink-soft">Start a sourcing campaign to find applicants.</p>
        ) : (
          <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
            {activeApplicants.filter(a => a.status !== 'hired').map((app) => (
              <div key={app.id}>
                <div className={`p-2 rounded-lg bg-surface-2 border ${app.status === 'rejected' ? 'border-red/30 opacity-60' : 'border-border'}`}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-semibold text-ink truncate">{app.name}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-soft text-indigo font-semibold">{app.role.replace('_', ' ')}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${
                          app.mood === 'patient' ? 'bg-green-soft text-green' :
                          app.mood === 'stubborn' ? 'bg-amber-soft text-amber' :
                          'bg-red-soft text-red'
                        }`}>{app.mood}</span>
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[9px] text-ink-soft">
                        <span>Lv.{app.level}</span>
                        <span>Speed {app.speed}x</span>
                        <span>{formatCash(app.expectedSalary)}/mo</span>
                        {app.negotiationRounds > 0 && <span className="text-ink font-semibold">R{app.negotiationRounds}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      {app.status !== 'rejected' && (
                        <button onClick={() => startNegotiate(app.id, app.expectedSalary)}
                          className="p-1 rounded hover:bg-indigo-soft hover:text-indigo transition-colors cursor-pointer text-ink-soft">
                          <MessageSquare className="w-3 h-3" />
                        </button>
                      )}
                      <button onClick={() => dismissApplicant(app.id)}
                        className="p-1 rounded hover:bg-red-soft hover:text-red transition-colors cursor-pointer text-ink-soft">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {negoResult && negoResult.applicantId === app.id && (
                    <div className={`mt-1.5 p-2 rounded-lg border text-[10px] ${
                      negoResult.result === 'hired' ? 'bg-green-soft border-green/30 text-green' :
                      negoResult.result === 'rejected' ? 'bg-red-soft border-red/30 text-red' :
                      'bg-indigo-soft border-indigo/30 text-indigo'
                    }`}>
                      <div className="flex items-center gap-1.5 font-semibold">
                        {negoResult.result === 'hired' ? <CheckCircle className="w-3 h-3" /> :
                         negoResult.result === 'rejected' ? <XCircle className="w-3 h-3" /> :
                         <MessageSquare className="w-3 h-3" />}
                        <span>{negoResult.message}</span>
                      </div>
                      {negoResult.result === 'countered' && negoResult.newSalary && (
                        <div className="mt-1 text-indigo-soft">New ask: {formatCash(negoResult.newSalary)}/mo</div>
                      )}
                    </div>
                  )}
                </div>

                {negotiatingId === app.id && app.status !== 'rejected' && app.status !== 'hired' && (
                  <div className="mt-1 ml-2 p-2 rounded-lg bg-surface border border-border">
                    <div className="text-[9px] text-ink-soft mb-1.5">Your offer ($/mo):</div>
                    <div className="flex gap-1.5">
                      <input type="number" value={offerInput} min={0}
                        onChange={e => setOfferInput(e.target.value)}
                        className="flex-1 bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-[11px] text-ink font-mono w-0 min-w-0" />
                      <button onClick={() => handleOffer(app.id)}
                        className="px-2.5 py-1.5 bg-indigo hover:bg-indigo/90 text-white text-[10px] font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1">
                        <Send className="w-3 h-3" /> Tawar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export const recruitmentPanelMeta = { title: 'Rekrutmen', icon: <UserCheck className="w-4 h-4 text-green" />, accent: '#17A366' };