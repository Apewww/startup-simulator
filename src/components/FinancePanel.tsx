import { useState } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Users, Server, BarChart3 } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { getTrafficStats } from '../systems/traffic';
import { calcMonthlyServerCost } from '../systems/server';
import { calculateRevenue } from '../systems/monetization';
import { CashFlowChart } from './CashFlowChart';

function formatCash(n: number): string {
  return `$${n.toLocaleString('en-US')}`;
}

function fmtStat(label: string, value: string, icon: React.ReactNode) {
  return (
    <div className="flex items-center gap-2 py-1.5 border-b border-surface-2 last:border-b-0">
      <span className="w-4 h-4 flex items-center justify-center text-ink-soft">{icon}</span>
      <span className="flex-1 text-[11px] text-ink-soft">{label}</span>
      <span className="text-xs font-semibold font-mono text-ink">{value}</span>
    </div>
  );
}

export function FinancePanel() {
  const { features, totalSalary, racks, rentedServers, month, cash, employees, cashFlowHistory } = useGameStore();
  const [chartOpen, setChartOpen] = useState(false);
  const trafficStats = getTrafficStats(features);
  const serverCost = (racks.length > 0 || rentedServers.length > 0) ? calcMonthlyServerCost(racks, rentedServers) : 0;
  const revenue = racks.length > 0 || features.some((f) => f.level > 0)
    ? calculateRevenue(trafficStats.users, features, racks)
    : { ads: 0, subscription: 0, total: 0, hasSubscription: false, uptimePenalty: 1 };

  const net = revenue.total - totalSalary - serverCost;
  const hasData = employees.length > 0 || racks.length > 0;

  return (
    <div className="space-y-3 text-xs">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-ink-soft font-mono">BULAN {month + 1}</span>
        <span className={`text-sm font-bold font-mono ${net >= 0 ? 'text-green' : 'text-red'}`}>
          {net >= 0 ? '+' : ''}{formatCash(net)}
        </span>
      </div>

      {!hasData ? (
        <div className="text-center py-6 text-ink-soft border border-dashed border-border rounded-lg">
          <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-40" strokeWidth={1.5} />
          <p className="text-xs">No financial activity yet.</p>
          <p className="text-[10px] mt-1">Hire employees and build features to start generating revenue.</p>
        </div>
      ) : (
        <>
          <div>
            <div className="text-[10px] font-semibold text-green uppercase tracking-wider mb-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Income
            </div>
            <Row label="Ads Revenue" value={formatCash(revenue.ads)} color="green" />
            {revenue.subscription > 0 && <Row label="Subscription" value={formatCash(revenue.subscription)} color="green" />}
            {revenue.subscription === 0 && revenue.ads > 0 && (
              <p className="text-[10px] text-amber-soft mt-0.5">Build Payment Gateway to unlock subscription revenue</p>
            )}
            {revenue.uptimePenalty < 1 && <p className="text-red text-[10px] mt-0.5">-50% crash penalty applied</p>}
          </div>

          <div>
            <div className="text-[10px] font-semibold text-red uppercase tracking-wider mb-1 flex items-center gap-1">
              <TrendingDown className="w-3 h-3" /> Expenses
            </div>
            <Row label={`Payroll (${employees.length})`} value={`-${formatCash(totalSalary)}`} color="red" />
            {serverCost > 0 && <Row label="Server Cost" value={`-${formatCash(serverCost)}`} color="red" />}
          </div>

          <div className="pt-2 border-t border-border space-y-1">
            {fmtStat('Cash on Hand', formatCash(cash), <DollarSign className="w-3 h-3" />)}
            {fmtStat('Users', trafficStats.users.toLocaleString(), <Users className="w-3 h-3" />)}
            {fmtStat('RPS', trafficStats.rps.toLocaleString(), <Server className="w-3 h-3" />)}
          </div>

          <div className="pt-1 border-t border-border">
            <button
              onClick={() => setChartOpen(o => !o)}
              className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo hover:text-indigo/80 transition-colors cursor-pointer w-full py-1"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              {chartOpen ? 'Hide Cash Flow' : 'Cash Flow Chart'}
              <span className="text-[10px] text-ink-soft font-normal ml-auto">{cashFlowHistory.length}m data</span>
            </button>
            {chartOpen && (
              <div className="mt-1">
                <CashFlowChart />
              </div>
            )}
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