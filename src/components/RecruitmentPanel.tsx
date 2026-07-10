import { UserCheck, Clock, X, User } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { CAMPAIGN_COST, CAMPAIGN_DAYS } from '../systems/recruitment';

function formatCash(n: number): string {
  return `$${n.toLocaleString('en-US')}`;
}

export function RecruitmentPanel() {
  const { cash, sourcingCampaign, applicants, startSourcing, cancelSourcing, dismissApplicant } = useGameStore();

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
              <span className="text-[10px] text-ink-soft font-mono">{sourcingCampaign.daysLeft} days left</span>
            </div>
            <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
              <div className="h-full bg-indigo rounded-full transition-all duration-300"
                style={{ width: `${((CAMPAIGN_DAYS[sourcingCampaign.tier] - sourcingCampaign.daysLeft) / CAMPAIGN_DAYS[sourcingCampaign.tier]) * 100}%` }} />
            </div>
            <button onClick={cancelSourcing}
              className="text-[10px] text-red hover:text-red/80 transition-colors cursor-pointer">
              Cancel
            </button>
          </div>
        ) : (
          <div className="space-y-1.5">
            {(['basic', 'pro', 'headhunter'] as const).map((tier) => {
              const cost = CAMPAIGN_COST[tier];
              const canAfford = cash >= cost;
              return (
                <button key={tier} onClick={() => canAfford && startSourcing(tier)} disabled={!canAfford}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                    canAfford
                      ? 'bg-surface-2 border border-border hover:border-indigo text-ink'
                      : 'bg-surface-2 border border-border opacity-40 cursor-not-allowed text-ink-soft'
                  }`}>
                  <div className="flex items-center gap-2">
                    <span className="capitalize">{tier}</span>
                    <span className="text-[9px] text-ink-soft font-normal">{CAMPAIGN_DAYS[tier]} days</span>
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
          <span className="text-[11px] font-bold text-ink">Applicants ({applicants.length})</span>
        </div>

        {applicants.length === 0 ? (
          <p className="text-[10px] text-ink-soft">Start a sourcing campaign to find applicants.</p>
        ) : (
          <div className="space-y-1.5 max-h-[280px] overflow-y-auto">
            {applicants.filter(a => a.status !== 'hired').map((app) => (
              <div key={app.id} className="flex items-start justify-between p-2 rounded-lg bg-surface-2 border border-border">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-ink truncate">{app.name}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-soft text-indigo font-semibold">{app.role.replace('_', ' ')}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[9px] text-ink-soft">
                    <span>Lv.{app.level}</span>
                    <span>Speed {app.speed}x</span>
                    <span>{formatCash(app.expectedSalary)}/mo</span>
                    <span className={`px-1 rounded ${
                      app.mood === 'patient' ? 'bg-green-soft text-green' :
                      app.mood === 'stubborn' ? 'bg-amber-soft text-amber' :
                      'bg-red-soft text-red'
                    }`}>{app.mood}</span>
                  </div>
                </div>
                <button onClick={() => dismissApplicant(app.id)}
                  className="p-1 rounded hover:bg-red-soft hover:text-red transition-colors cursor-pointer shrink-0 text-ink-soft">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export const recruitmentPanelMeta = { title: 'Rekrutmen', icon: <UserCheck className="w-4 h-4 text-green" />, accent: '#17A366' };