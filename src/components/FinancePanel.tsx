import { DollarSign } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { getTrafficStats } from '../systems/traffic';
import { calcMonthlyServerCost } from '../systems/server';
import { calculateRevenue } from '../systems/monetization';

function formatCash(n: number): string {
  return `$${n.toLocaleString('en-US')}`;
}

export function FinancePanel() {
  const { features, totalSalary, racks, rentedServers, month } = useGameStore();
  const trafficStats = getTrafficStats(features);
  const serverCost = (racks.length > 0 || rentedServers.length > 0) ? calcMonthlyServerCost(racks, rentedServers) : 0;
  const revenue = racks.length > 0 || features.some((f) => f.level > 0)
    ? calculateRevenue(trafficStats.users, features, racks)
    : { ads: 0, subscription: 0, total: 0, hasSubscription: false, uptimePenalty: 1 };

  const net = revenue.total - totalSalary - serverCost;
  const hasData = totalSalary > 0 || serverCost > 0 || revenue.total > 0;

  return (
    <div className="space-y-2 text-xs">
      <div className="text-[11px] font-semibold text-ink-soft font-mono">BULAN {month + 1}</div>
      {!hasData ? (
        <p className="text-ink-soft text-xs">No financial activity yet.</p>
      ) : (
        <>
          <Row label="Ads Revenue" value={formatCash(revenue.ads)} color="green" />
          {revenue.subscription > 0 && <Row label="Subscription" value={formatCash(revenue.subscription)} color="green" />}
          {revenue.uptimePenalty < 1 && <p className="text-red text-[11px]">-50% crash penalty applied</p>}
          <Row label="Payroll" value={`-${formatCash(totalSalary)}`} color="red" />
          {serverCost > 0 && <Row label="Server Cost" value={`-${formatCash(serverCost)}`} color="red" />}
          <div className={`pt-1.5 mt-1.5 border-t border-border font-bold font-mono text-xs ${net >= 0 ? 'text-green' : 'text-red'}`}>
            NET: {formatCash(net)}
          </div>
        </>
      )}
    </div>
  );
}

function Row({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex justify-between items-center py-1">
      <span className="text-ink font-semibold">{label}</span>
      <span className={`font-mono ${color === 'green' ? 'text-green' : 'text-red'}`}>{value}</span>
    </div>
  );
}

export const financePanelMeta = { title: 'Keuangan', icon: <DollarSign className="w-4 h-4 text-green" />, accent: '#17A366' };