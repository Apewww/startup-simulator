import { useEffect, useState, useCallback } from 'react';
import { useGameStore, type Notification } from './store/gameStore';
import { MainMenu } from './components/MainMenu';
import { ProductSelect } from './components/ProductSelect';
import { ServerPanel } from './components/ServerPanel';
import { DevPanel } from './components/DevPanel';
import { HudBar } from './components/HudBar';
import { Dock } from './components/Dock';
import { MainViewport } from './components/MainViewport';
import { PanelTaskbar } from './components/PanelTaskbar';
import { FloatingPanel } from './components/FloatingPanel';
import { EmployeesPanel, employeesPanelMeta } from './components/EmployeesPanel';
import { FeaturesPanel, featuresPanelMeta } from './components/FeaturesPanel';
import { FinancePanel, financePanelMeta } from './components/FinancePanel';
import { Server, Skull, CheckCircle, Info, AlertTriangle, XCircle } from 'lucide-react';
import { saveGame } from './systems/saveLoad';
import { db } from './db/gameDB';

function formatCash(n: number): string {
  return `$${n.toLocaleString('en-US')}`;
}

function GameOverScreen() {
  const cash = useGameStore((s) => s.cash);
  const month = useGameStore((s) => s.month);
  const employees = useGameStore((s) => s.employees);

  const handleRestart = async () => {
    await db.saves.delete(1);
    localStorage.removeItem('hasSave');
    useGameStore.getState().restartGame();
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="card border-2 border-red p-10 max-w-lg text-center">
        <Skull className="w-16 h-16 mx-auto mb-4 text-red" strokeWidth={1.5} />
        <h1 className="text-3xl font-bold text-red mb-2">BANKRUPT</h1>
        <p className="text-ink-soft mb-6">Your startup has run out of funds.</p>
        <div className="space-y-2 text-sm text-ink-soft mb-8">
          <p>Survived: {month} months</p>
          <p>Team size: {employees.length} employees</p>
          <p>Final cash: {formatCash(cash)}</p>
          {month === 0 && <p className="text-amber mt-2">Tip: Start with hiring, build features, then manage server costs!</p>}
        </div>
        <button
          onClick={handleRestart}
          className="px-8 py-3 bg-indigo hover:bg-indigo/90 text-white font-semibold rounded-[10px] transition-colors cursor-pointer"
        >
          Restart Game
        </button>
      </div>
    </div>
  );
}

function useAutosave(selectedProduct: string | null) {
  useEffect(() => {
    if (!selectedProduct) return;
    const interval = setInterval(async () => {
      await saveGame();
      localStorage.setItem('hasSave', '1');
    }, 60000);
    return () => clearInterval(interval);
  }, [selectedProduct]);
}

const TOAST_ICONS: Record<Notification['type'], typeof Info> = {
  success: CheckCircle,
  info: Info,
  warning: AlertTriangle,
  error: XCircle,
};
const TOAST_COLORS: Record<Notification['type'], string> = {
  success: '#17A366',
  info: '#4F5EFF',
  warning: '#B7791F',
  error: '#D1453B',
};

function ToastContainer() {
  const notifications = useGameStore((s) => s.notifications);
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {notifications.map((n) => {
        const Icon = TOAST_ICONS[n.type];
        const color = TOAST_COLORS[n.type];
        return (
          <div
            key={n.id}
            className="pointer-events-auto flex items-center gap-2.5 px-4 py-2.5 border bg-surface shadow-[0_12px_32px_-8px_rgba(20,30,60,0.15)] rounded-[10px] animate-[slideInRight_180ms_ease-out]"
            style={{ borderColor: color, minWidth: 220 }}
          >
            <Icon className="w-4 h-4 shrink-0" style={{ color }} strokeWidth={2} />
            <span className="text-xs text-ink">{n.message}</span>
          </div>
        );
      })}
    </div>
  );
}

function App() {
  const { isPaused, speed, incrementTick, selectedProduct, devMode, toggleDevMode, isBankrupt, screen } = useGameStore();
  const [saveMsg, setSaveMsg] = useState('');

  useEffect(() => {
    if (isPaused || !selectedProduct || isBankrupt) return;
    const interval = setInterval(incrementTick, 2000 / speed);
    return () => clearInterval(interval);
  }, [isPaused, speed, incrementTick, selectedProduct, isBankrupt]);

  useAutosave(selectedProduct);

  const handleSave = useCallback(async () => {
    await saveGame();
    setSaveMsg('Game saved!');
    setTimeout(() => setSaveMsg(''), 2000);
  }, []);

  if (isBankrupt) {
    return <GameOverScreen />;
  }

  if (screen === 'menu') {
    return <MainMenu />;
  }

  if (screen === 'select') {
    return <ProductSelect />;
  }

  return (
    <div className="flex flex-col h-screen bg-bg text-ink overflow-hidden">
      <HudBar onSave={handleSave} saveMsg={saveMsg} />

      <div className="flex flex-1 min-h-0">
        <Dock />

        <MainViewport />

        {/* Floating window layer */}
        <div className="fixed inset-0 pointer-events-none">
          <FloatingPanel id="employees" index={0} title={employeesPanelMeta.title} icon={employeesPanelMeta.icon} accent="#4F5EFF">
            <EmployeesPanel />
          </FloatingPanel>

          <FloatingPanel id="features" index={1} title={featuresPanelMeta.title} icon={featuresPanelMeta.icon} accent="#4F5EFF">
            <FeaturesPanel />
          </FloatingPanel>

          <FloatingPanel id="server" index={2} title="Server" icon={<Server className="w-4 h-4 text-indigo" />} accent="#4F5EFF">
            <ServerPanel />
          </FloatingPanel>

          <FloatingPanel id="finance" index={3} title={financePanelMeta.title} icon={financePanelMeta.icon} accent="#4F5EFF">
            <FinancePanel />
          </FloatingPanel>
        </div>
      </div>

      <PanelTaskbar />

      <ToastContainer />

      {import.meta.env.DEV && (
        <button
          onClick={toggleDevMode}
          className={`fixed bottom-24 md:bottom-4 left-4 z-40 px-3 py-1.5 text-xs font-mono transition-colors cursor-pointer rounded-[8px] ${devMode ? 'bg-amber text-white' : 'bg-surface text-ink-soft border border-border hover:bg-surface-2'}`}
        >
          {devMode ? 'DEV ON' : 'DEV'}
        </button>
      )}
      <DevPanel />
    </div>
  );
}

export default App;