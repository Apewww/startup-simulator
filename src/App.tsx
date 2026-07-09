import { useEffect, useState, useCallback } from 'react';
import { useGameStore } from './store/gameStore';
import { ProductSelect } from './components/ProductSelect';
import { ServerPanel } from './components/ServerPanel';
import { DevPanel } from './components/DevPanel';
import { HudBar } from './components/HudBar';
import { Dock } from './components/Dock';
import { MainViewport } from './components/MainViewport';
import { FloatingPanel } from './components/FloatingPanel';
import { EmployeesPanel, employeesPanelMeta } from './components/EmployeesPanel';
import { FeaturesPanel, featuresPanelMeta } from './components/FeaturesPanel';
import { FinancePanel, financePanelMeta } from './components/FinancePanel';
import { Server, Skull } from 'lucide-react';
import { saveGame, loadGame } from './systems/saveLoad';
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
    <div className="scanlines min-h-screen bg-[#0A0E27] flex items-center justify-center">
      <div className="bg-gray-800 rounded-xl border-2 border-red-500 p-10 max-w-lg text-center shadow-xl">
        <Skull className="w-16 h-16 mx-auto mb-4 text-red-400" strokeWidth={1.5} />
        <h1 className="text-3xl font-bold text-red-400 mb-2 neon-glow">BANKRUPT</h1>
        <p className="text-gray-400 mb-6">Your startup has run out of funds.</p>
        <div className="space-y-2 text-sm text-gray-400 mb-8">
          <p>Survived: {month} months</p>
          <p>Team size: {employees.length} employees</p>
          <p>Final cash: {formatCash(cash)}</p>
          {month === 0 && <p className="text-yellow-400 mt-2">Tip: Start with hiring, build features, then manage server costs!</p>}
        </div>
        <button
          onClick={handleRestart}
          className="px-8 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-lg font-semibold transition-colors cursor-pointer"
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

function App() {
  const { isPaused, speed, incrementTick, selectedProduct, devMode, toggleDevMode, isBankrupt } = useGameStore();
  const [saveMsg, setSaveMsg] = useState('');

  useEffect(() => {
    if (isPaused || !selectedProduct || isBankrupt) return;
    const interval = setInterval(incrementTick, 1000 / speed);
    return () => clearInterval(interval);
  }, [isPaused, speed, incrementTick, selectedProduct, isBankrupt]);

  useEffect(() => {
    if (!selectedProduct) return;
    const saved = localStorage.getItem('hasSave');
    if (!saved) return;
    setSaveMsg('Save file detected — click Load to continue');
  }, [selectedProduct]);

  useAutosave(selectedProduct);

  const handleSave = useCallback(async () => {
    await saveGame();
    localStorage.setItem('hasSave', '1');
    setSaveMsg('Game saved!');
    setTimeout(() => setSaveMsg(''), 2000);
  }, []);

  const handleLoad = useCallback(async () => {
    const ok = await loadGame();
    setSaveMsg(ok ? 'Game loaded!' : 'No save file found');
    setTimeout(() => setSaveMsg(''), 2000);
  }, []);

  if (isBankrupt) {
    return <GameOverScreen />;
  }

  if (!selectedProduct) {
    return <ProductSelect />;
  }

  return (
    <div className="scanlines flex flex-col h-screen bg-[#0A0E27] text-gray-100 overflow-hidden">
      <HudBar onSave={handleSave} onLoad={handleLoad} saveMsg={saveMsg} />

      <div className="flex flex-1 min-h-0">
        <Dock />

        <MainViewport />

        <aside className="hidden md:flex md:flex-col w-[360px] shrink-0 overflow-y-auto p-3 space-y-3 bg-[rgba(5,8,20,0.6)] border-l-2 border-[#7C3AED]/40">
          <FloatingPanel id="employees" title={employeesPanelMeta.title} icon={employeesPanelMeta.icon} accent={employeesPanelMeta.accent}>
            <EmployeesPanel />
          </FloatingPanel>

          <FloatingPanel id="features" title={featuresPanelMeta.title} icon={featuresPanelMeta.icon} accent={featuresPanelMeta.accent}>
            <FeaturesPanel />
          </FloatingPanel>

          <FloatingPanel id="server" title="Server" icon={<Server className="w-4 h-4 text-[#00FFFF]" />} accent="#00FFFF">
            <ServerPanel />
          </FloatingPanel>

          <FloatingPanel id="finance" title={financePanelMeta.title} icon={financePanelMeta.icon} accent={financePanelMeta.accent}>
            <FinancePanel />
          </FloatingPanel>
        </aside>
      </div>

      {import.meta.env.DEV && (
        <button
          onClick={toggleDevMode}
          className={`fixed bottom-20 md:bottom-4 left-4 z-40 px-3 py-1.5 rounded text-xs font-mono transition-colors cursor-pointer ${devMode ? 'bg-yellow-600 text-black' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
        >
          {devMode ? 'DEV ON' : 'DEV'}
        </button>
      )}
      <DevPanel />
    </div>
  );
}

export default App;
