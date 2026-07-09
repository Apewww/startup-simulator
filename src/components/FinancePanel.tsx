import { DollarSign } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { getTrafficStats } from '../systems/traffic';
import { calcMonthlyServerCost } from '../systems/server';
import { calculateRevenue } from '../systems/monetization';

function formatCash(n: number): string {
  return `$${n.toLocaleString('en-US')}`;
}

export function FinancePanel() {
  const { features, totalSalary, racks, month } = useGameStore();
  const trafficStats = getTrafficStats(features);
  const serverCost = racks.length > 0 ? calcMonthlyServerCost(racks) : 0;
  const revenue = racks.length > 0 || features.some((f) => f.level > 0)
    ? calculateRevenue(trafficStats.users, features, racks)
    : { ads: 0, subscription: 0, total: 0, hasSubscription: false, uptimePenalty: 1 };

  const net = revenue.total - totalSalary - serverCost;
  const hasData = totalSalary > 0 || serverCost > 0 || revenue.total > 0;

  return (
    <div className="space-y-3 text-sm">
      <div className="text-gray-500 text-xs font-['Share_Tech_Mono]">MONTHLY @ M{month + 1}</div>
      {!hasData ? (
        <p className="text-gray-500 text-sm">No financial activity yet.</p>
      ) : (
        <>
          <Row label="Income" value={formatCash(revenue.total)} color="#4ADE80" />
          {revenue.ads > 0 && <Row label="  ↳ Ads" value={formatCash(revenue.ads)} color="#22C55E" />}
          {revenue.subscription > 0 && <Row label="  ↳ Subscription" value={formatCash(revenue.subscription)} color="#22C55E" />}
          {revenue.uptimePenalty < 1 && <p className="text-red-400 text-xs">-50% crash penalty applied</p>}
          <Row label="Payroll" value={`-${formatCash(totalSalary)}`} color="#F87171" />
          {serverCost > 0 && <Row label="Server" value={`-${formatCash(serverCost)}`} color="#F87171" />}
          <div className={`mt-2 pt-2 border-t border-gray-700 font-semibold font-['Share_Tech_Mono] ${net >= 0 ? 'text-green-300' : 'text-red-300'}`}>
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

export const financePanelMeta = { title: 'Finance', icon: <DollarSign className="w-4 h-4 text-[#F97316]" />, accent: '#F97316' };
