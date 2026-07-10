import { useState } from 'react';
import { UserCheck, Clock, X, User, Send, MessageSquare, CheckCircle, XCircle } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { CAMPAIGN_COST, CAMPAIGN_DAYS } from '../systems/recruitment';

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
  const { cash, sourcingCampaign, applicants, startSourcing, cancelSourcing, negotiateSalary, dismissApplicant } = useGameStore();
  const [negotiatingId, setNegotiatingId] = useState<string | null>(null);
  const [offerInput, setOfferInput] = useState('');
  const [negoResult, setNegoResult] = useState<NegotiationState | null>(null);

  const activeApplicants = applicants.filter(a => a.status !== 'hired');

  const startNegotiate = (id: string, expectedSalary: number) => {
    setNegotiatingId(id);
    setOfferInput(String(expectedSalary));
    setNegoResult(null);
  };

  const handleOffer = (appId: string) => {
    const app = applicants.find(a => a.id === appId);
    if (!app) return;
    negotiateSalary(appId, Number(offerInput));
    // Get updated applicant state after negotiation
    const updated = useGameStore.getState().applicants.find(a => a.id === appId);
    if (!updated) return;

    if (updated.status === 'hired') {
      setNegoResult({ applicantId: appId, message: 'Deal! When do I start?', result: 'hired' });
      setTimeout(() => { setNegotiatingId(null); setNegoResult(null); }, 2000);
    } else if (updated.status === 'rejected') {
      setNegoResult({ applicantId: appId, message: 'No deal. Good luck.', result: 'rejected' });
    } else {
      const msg = updated.negotiationRounds >= (
        updated.mood === 'patient' ? 4 : updated.mood === 'stubborn' ? 2 : 1
      )
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
              <span className="text-[10px] text-ink-soft font-mono">{sourcingCampaign.daysLeft}d left</span>
            </div>
            <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
              <div className="h-full bg-indigo rounded-full transition-all duration-300"
                style={{ width: `${((CAMPAIGN_DAYS[sourcingCampaign.tier] - sourcingCampaign.daysLeft) / CAMPAIGN_DAYS[sourcingCampaign.tier]) * 100}%` }} />
            </div>
            <button onClick={cancelSourcing} className="text-[10px] text-red hover:text-red/80 transition-colors cursor-pointer">Cancel</button>
          </div>
        ) : (
          <div className="space-y-1.5">
            {(['basic', 'pro', 'headhunter'] as const).map((tier) => {
              const cost = CAMPAIGN_COST[tier];
              const canAfford = cash >= cost;
              return (
                <button key={tier} onClick={() => canAfford && startSourcing(tier)} disabled={!canAfford}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                    canAfford ? 'bg-surface-2 border border-border hover:border-indigo text-ink' : 'bg-surface-2 border border-border opacity-40 cursor-not-allowed text-ink-soft'
                  }`}>
                  <div className="flex items-center gap-2">
                    <span className="capitalize">{tier}</span>
                    <span className="text-[9px] text-ink-soft font-normal">{CAMPAIGN_DAYS[tier]}d</span>
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

                  {/* Negotiation response */}
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

                {/* Negotiation input */}
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