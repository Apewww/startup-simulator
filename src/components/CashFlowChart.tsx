import { useState, useMemo } from 'react';
import { useGameStore, type MonthlySnapshot } from '../store/gameStore';

const CHART_HEIGHT = 140;
const CHART_PADDING = { top: 12, right: 8, bottom: 20, left: 44 };
const BAR_GAP = 4;

function formatCompact(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
}

function formatCash(n: number): string {
  return `$${n.toLocaleString('en-US')}`;
}

export function CashFlowChart() {
  const history = useGameStore((s) => s.cashFlowHistory);
  const [hovered, setHovered] = useState<MonthlySnapshot | null>(null);

  const { bars, yMax, yMin, yLabels, chartW, chartH } = useMemo(() => {
    if (history.length < 2) return { bars: [], yMax: 0, yMin: 0, yLabels: [], chartW: 0, chartH: 0 };

    const values = history.map(h => Math.max(h.revenue, h.expenses, Math.abs(h.net)));
    const maxVal = Math.max(...values, 100);
    const paddedMax = Math.ceil(maxVal / 500) * 500 + 500;

    const w = Math.max(200, history.length * 40);
    const h = CHART_HEIGHT;
    const plotW = w - CHART_PADDING.left - CHART_PADDING.right;
    const plotH = h - CHART_PADDING.top - CHART_PADDING.bottom;

    const yRange = paddedMax;
    const step = Math.ceil(yRange / 4 / 100) * 100;
    const labels: number[] = [];
    for (let v = 0; v <= yRange; v += step) {
      labels.push(v);
    }

    const barW = Math.max(6, Math.floor((plotW - (history.length - 1) * BAR_GAP) / history.length));

    const rendered = history.map((snap, i) => {
      const x = CHART_PADDING.left + i * (barW + BAR_GAP);
      const revH = (snap.revenue / yRange) * plotH;
      const expH = (snap.expenses / yRange) * plotH;
      const netH = (Math.abs(snap.net) / yRange) * plotH;
      const isPos = snap.net >= 0;
      return { x, barW, revH, expH, netH, isPos, snap };
    });

    return { bars: rendered, yMax: paddedMax, yMin: 0, yLabels: labels, chartW: w, chartH: h };
  }, [history]);

  if (history.length < 2) {
    return (
      <div className="text-center py-5 text-ink-soft border border-dashed border-border rounded-lg">
        <p className="text-xs">Not enough data yet.</p>
        <p className="text-[10px] mt-1">Complete 2+ months in-game to see cash flow trends.</p>
      </div>
    );
  }

  const plotW = chartW - CHART_PADDING.left - CHART_PADDING.right;
  const plotH = chartH - CHART_PADDING.top - CHART_PADDING.bottom;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${chartW} ${chartH + 20}`} className="w-full h-auto overflow-visible" style={{ maxHeight: 200 }}>
        <defs>
          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#17A366" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#17A366" stopOpacity={0.05} />
          </linearGradient>
          <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#D1453B" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#D1453B" stopOpacity={0.05} />
          </linearGradient>
        </defs>

        {yLabels.map((label) => {
          const y = CHART_PADDING.top + plotH - (label / yMax) * plotH;
          return (
            <g key={label}>
              <line x1={CHART_PADDING.left} y1={y} x2={chartW - CHART_PADDING.right} y2={y} stroke="#E3E7EE" strokeWidth={1} />
              <text x={CHART_PADDING.left - 6} y={y + 3} textAnchor="end" className="text-[9px]" fill="#667085">
                ${formatCompact(label)}
              </text>
            </g>
          );
        })}

        <line x1={CHART_PADDING.left} y1={CHART_PADDING.top + plotH} x2={chartW - CHART_PADDING.right} y2={CHART_PADDING.top + plotH} stroke="#E3E7EE" strokeWidth={1} />

        {bars.map((bar) => {
          const revY = CHART_PADDING.top + plotH - bar.revH;
          const expY = CHART_PADDING.top + plotH - bar.expH;
          return (
            <g key={bar.snap.month}>
              <rect
                x={bar.x}
                y={revY}
                width={bar.barW}
                height={bar.revH}
                fill="url(#revGrad)"
                stroke="#17A366"
                strokeWidth={1}
                rx={1}
                className="transition-opacity duration-150"
                style={{ opacity: hovered?.month === bar.snap.month ? 1 : 0.7 }}
                onMouseEnter={() => setHovered(bar.snap)}
                onMouseLeave={() => setHovered(null)}
              />
              <rect
                x={bar.x}
                y={expY}
                width={bar.barW}
                height={bar.expH}
                fill="url(#expGrad)"
                stroke="#D1453B"
                strokeWidth={1}
                rx={1}
                className="transition-opacity duration-150"
                style={{ opacity: hovered?.month === bar.snap.month ? 1 : 0.7 }}
                onMouseEnter={() => setHovered(bar.snap)}
                onMouseLeave={() => setHovered(null)}
              />
              <text
                x={bar.x + bar.barW / 2}
                y={CHART_PADDING.top + plotH + 14}
                textAnchor="middle"
                className="text-[8px]"
                fill={hovered?.month === bar.snap.month ? '#1A2233' : '#667085'}
                fontWeight={hovered?.month === bar.snap.month ? 600 : 400}
              >{`M${bar.snap.month}`}</text>
            </g>
          );
        })}
      </svg>

      {hovered && (
        <div className="absolute top-0 right-0 bg-surface border border-border rounded-lg px-3 py-2 shadow-[0_4px_12px_-4px_rgba(20,30,60,0.12)] text-xs space-y-1 z-10" style={{ minWidth: 140 }}>
          <div className="font-semibold text-ink">Month {hovered.month}</div>
          <div className="flex justify-between gap-4">
            <span className="text-green">Revenue</span>
            <span className="font-mono text-green">{formatCash(hovered.revenue)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-red">Expenses</span>
            <span className="font-mono text-red">{formatCash(hovered.expenses)}</span>
          </div>
          <div className="border-t border-border pt-1 flex justify-between gap-4 font-semibold">
            <span className={hovered.net >= 0 ? 'text-green' : 'text-red'}>Net</span>
            <span className={`font-mono ${hovered.net >= 0 ? 'text-green' : 'text-red'}`}>
              {hovered.net >= 0 ? '+' : ''}{formatCash(hovered.net)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
