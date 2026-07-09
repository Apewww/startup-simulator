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
    <div className="space-y-3 text-sm">
      <div className="text-text-muted text-xs font-mono">MONTHLY @ M{month + 1}</div>
      {!hasData ? (
        <p className="text-text-muted text-sm">No financial activity yet.</p>
      ) : (
        <>
          <Row label="Income" value={formatCash(revenue.total)} color="#22C55E" />
          {revenue.ads > 0 && <Row label="  ↳ Ads" value={formatCash(revenue.ads)} color="#22C55E" />}
          {revenue.subscription > 0 && <Row label="  ↳ Subscription" value={formatCash(revenue.subscription)} color="#22C55E" />}
          {revenue.uptimePenalty < 1 && <p className="text-danger text-xs">-50% crash penalty applied</p>}
          <Row label="Payroll" value={`-${formatCash(totalSalary)}`} color="#DC2626" />
          {serverCost > 0 && <Row label="Server" value={`-${formatCash(serverCost)}`} color="#DC2626" />}
          <div className={`mt-2 pt-2 border-t-2 border-border font-semibold font-mono ${net >= 0 ? 'text-profit' : 'text-danger'}`}>
            NET: {formatCash(net)}
          </div>
        </>
      )}
    </div>
  );
}

function Row({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex justify-between" style={{ color }}>
      <span>{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}

export const financePanelMeta = { title: 'Finance', icon: <DollarSign className="w-4 h-4 text-profit" />, accent: '#16A34A' };