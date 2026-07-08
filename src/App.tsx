import { useEffect } from 'react';
import { useGameStore, TICKS_PER_MONTH } from './store/gameStore';

function formatCash(n: number): string {
  return `$${n.toLocaleString('en-US')}`;
}

function App() {
  const { tick, isPaused, speed, cash, month, employees, totalSalary, togglePause, setSpeed, incrementTick } = useGameStore();

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(incrementTick, 1000 / speed);
    return () => clearInterval(interval);
  }, [isPaused, speed, incrementTick]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-2">Startup Simulator</h1>
      <p className="text-gray-400 mb-8">Fase 1 — Excel Phase</p>

      <div className="max-w-md space-y-4">
        <div className="flex items-center gap-4">
          <span className="text-lg font-mono">Tick: {tick}</span>
          <span className="text-sm text-gray-400">
            ({isPaused ? 'PAUSED' : `Running @ ${speed}x`})
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xl font-mono text-green-400">{formatCash(cash)}</span>
          <span className="text-sm text-gray-400">
            Month {month} ({(tick % TICKS_PER_MONTH)}/{TICKS_PER_MONTH} ticks)
          </span>
        </div>

        <div className="text-sm text-gray-400">
          Employees: {employees.length} | Monthly payroll: {formatCash(totalSalary)}
        </div>

        <div className="flex gap-2">
          <button
            onClick={togglePause}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
          >
            {isPaused ? 'Play' : 'Pause'}
          </button>
          {([1, 2, 4] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`px-3 py-2 rounded transition-colors ${
                speed === s
                  ? 'bg-green-600 cursor-default'
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>

        <div className="text-sm text-gray-500">
          {totalSalary > 0 && cash > 0 && `Next salary deduction: Month ${month + 1}`}
        </div>
      </div>
    </div>
  );
}

export default App;
