import { useEffect, useState, useCallback } from 'react';
import { useGameStore, type Notification } from './store/gameStore';
import { MainMenu } from './components/MainMenu';
import { ProductSelect } from './components/ProductSelect';
import { PlayerSetup } from './components/PlayerSetup';
import { ServerPanel } from './components/ServerPanel';
import { ProductBar } from './components/ProductBar';
import { DevPanel } from './components/DevPanel';
import { EventBanner } from './components/EventBanner';
import { HudBar } from './components/HudBar';
import { Dock } from './components/Dock';
import { MainViewport } from './components/MainViewport';
import { PanelTaskbar } from './components/PanelTaskbar';
import { FloatingPanel } from './components/FloatingPanel';
import { EmployeesPanel, employeesPanelMeta } from './components/EmployeesPanel';
import { FeaturesPanel, featuresPanelMeta } from './components/FeaturesPanel';
import { FinancePanel, financePanelMeta } from './components/FinancePanel';
import { RecruitmentPanel, recruitmentPanelMeta } from './components/RecruitmentPanel';
import { PerksPanel } from './components/PerksPanel';
import { AdSalesPanel, adSalesPanelMeta } from './components/AdSalesPanel';
import { BankingPanel, bankingPanelMeta } from './components/BankingPanel';
import { MarketPanel } from './components/MarketPanel';
import { MarketingPanel } from './components/MarketingPanel';
import { ResearchPanel } from './components/ResearchPanel';
import { InvestorRelationsPanel } from './components/InvestorRelationsPanel';
import { WealthPanel } from './components/WealthPanel';
import { TakeoverCapitalBanner } from './components/TakeoverCapitalBanner';
import { Server, Skull, CheckCircle, Info, AlertTriangle, XCircle, Gift, BarChart3, Megaphone, Microscope, Handshake, Wallet, Bug } from 'lucide-react';
import { saveGame } from './systems/saveLoad';
import { db } from './db/gameDB';

function formatCash(n: number): string {
  return `$${n.toLocaleString('en-US')}`;
}

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function GameOverScreen() {
  const cash = useGameStore((s) => s.cash);
  const month = useGameStore((s) => s.month);
  const employees = useGameStore((s) => s.employees);
  const racks = useGameStore((s) => s.racks);
  const currentUsers = useGameStore((s) => s.currentUsers);
  const currentSlotId = useGameStore((s) => s.currentSlotId);

  const handleRestart = async () => {
    if (currentSlotId) await db.saves.delete(currentSlotId);
    useGameStore.getState().restartGame();
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="card border-2 border-red p-10 max-w-lg text-center">
        <Skull className="w-16 h-16 mx-auto mb-4 text-red" strokeWidth={1.5} />
        <h1 className="text-3xl font-bold text-red mb-2">BANKRUPT</h1>
        <p className="text-ink-soft mb-6">Your startup has run out of funds.</p>
        <div className="grid grid-cols-2 gap-3 mb-8 text-sm">
          <div className="bg-red-soft rounded-lg p-3">
            <div className="text-[10px] text-red font-semibold uppercase tracking-wider">Survived</div>
            <div className="text-lg font-bold text-red">{month} months</div>
          </div>
          <div className="bg-red-soft rounded-lg p-3">
            <div className="text-[10px] text-red font-semibold uppercase tracking-wider">Team</div>
            <div className="text-lg font-bold text-red">{employees.length} people</div>
          </div>
          <div className="bg-surface-2 rounded-lg p-3 border border-border">
            <div className="text-[10px] text-ink-soft font-semibold uppercase tracking-wider">Users</div>
            <div className="text-lg font-bold text-ink">{formatCompact(currentUsers)}</div>
          </div>
          <div className="bg-surface-2 rounded-lg p-3 border border-border">
            <div className="text-[10px] text-ink-soft font-semibold uppercase tracking-wider">Servers</div>
            <div className="text-lg font-bold text-ink">{racks.length} racks</div>
          </div>
        </div>
        <div className="text-xs text-ink-soft mb-6">
          Final cash: {formatCash(cash)}
          {employees.length === 0 && <p className="text-amber mt-2">Tip: Start with hiring, build features, then manage server costs!</p>}
        </div>
        <button
          onClick={handleRestart}
          className="px-8 py-3 bg-indigo hover:bg-indigo/90 text-white font-semibold rounded-[10px] transition-all duration-200 hover:translate-y-[-1px] cursor-pointer"
        >
          Restart Game
        </button>
      </div>
    </div>
  );
}

function useAutosave(activeProductId: string | null) {
  useEffect(() => {
    if (!activeProductId) return;
    const interval = setInterval(async () => {
      const slotId = useGameStore.getState().currentSlotId;
      if (slotId) await saveGame(slotId);
    }, 60000);
    return () => clearInterval(interval);
  }, [activeProductId]);
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
  const { isPaused, speed, incrementTick, activeProductId, devMode, toggleDevMode, isBankrupt, screen, darkMode, toggleDarkMode, maximizedPanel, companyName } = useGameStore();
  const [saveMsg, setSaveMsg] = useState('');
  const [showCompanyPrompt, setShowCompanyPrompt] = useState(false);
  const [companyInput, setCompanyInput] = useState('');

  useEffect(() => {
    if (screen === 'playing' && !companyName && !showCompanyPrompt) {
      setShowCompanyPrompt(true);
    }
  }, [screen, companyName]);

  useEffect(() => {
    if (isPaused || !activeProductId || isBankrupt) return;
    const interval = setInterval(incrementTick, 2000 / speed);
    return () => clearInterval(interval);
  }, [isPaused, speed, incrementTick, activeProductId, isBankrupt]);

  useAutosave(activeProductId);

  const handleSave = useCallback(async () => {
    await saveGame();
    setSaveMsg('Game saved!');
    setTimeout(() => setSaveMsg(''), 2000);
  }, []);

  if (isBankrupt) {
    return (
      <div data-theme={darkMode ? 'dark' : undefined} className="bg-bg text-ink min-h-screen">
        <GameOverScreen />
      </div>
    );
  }

  if (screen === 'menu') {
    return (
      <div data-theme={darkMode ? 'dark' : undefined} className="bg-bg text-ink min-h-screen">
        <MainMenu />
      </div>
    );
  }

  if (screen === 'select') {
    return (
      <div data-theme={darkMode ? 'dark' : undefined} className="bg-bg text-ink min-h-screen">
        <ProductSelect />
      </div>
    );
  }

  if (screen === 'playerSetup') {
    return (
      <div data-theme={darkMode ? 'dark' : undefined} className="bg-bg text-ink min-h-screen">
        <PlayerSetup />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-bg text-ink overflow-hidden" data-theme={darkMode ? 'dark' : undefined}>
      <HudBar onSave={handleSave} saveMsg={saveMsg} onToggleTheme={toggleDarkMode} darkMode={darkMode} />
      <ProductBar />

      <div className="flex flex-1 min-h-0">
        <Dock />

        <MainViewport />
      </div>

      {/* Maximized backdrop */}
      {maximizedPanel && (
        <div className="fixed inset-0 z-30 bg-black/10 max-md:hidden"
          onClick={() => useGameStore.getState().setMaximizedPanel(null)} />
      )}

      {/* Floating window layer */}
      <div className="fixed inset-0 pointer-events-none z-40">
          <FloatingPanel id="employees" index={0} title={employeesPanelMeta.title} icon={employeesPanelMeta.icon} accent="#4F5EFF">
            <EmployeesPanel />
          </FloatingPanel>

          <FloatingPanel id="recruitment" index={1} title={recruitmentPanelMeta.title} icon={recruitmentPanelMeta.icon} accent="#17A366">
            <RecruitmentPanel />
          </FloatingPanel>

          <FloatingPanel id="features" index={2} title={featuresPanelMeta.title} icon={featuresPanelMeta.icon} accent="#4F5EFF">
            <FeaturesPanel />
          </FloatingPanel>

          <FloatingPanel id="server" index={3} title="Server" icon={<Server className="w-4 h-4 text-indigo" />} accent="#4F5EFF">
            <ServerPanel />
          </FloatingPanel>

          <FloatingPanel id="finance" index={4} title={financePanelMeta.title} icon={financePanelMeta.icon} accent="#4F5EFF">
            <FinancePanel />
          </FloatingPanel>

          <FloatingPanel id="perks" index={5} title="Perks" icon={<Gift className="w-4 h-4 text-amber" />} accent="#B7791F">
            <PerksPanel />
          </FloatingPanel>

          <FloatingPanel id="adsales" index={6} title={adSalesPanelMeta.title} icon={adSalesPanelMeta.icon} accent={adSalesPanelMeta.accent}>
            <AdSalesPanel />
          </FloatingPanel>

          <FloatingPanel id="banking" index={7} title={bankingPanelMeta.title} icon={bankingPanelMeta.icon} accent={bankingPanelMeta.accent}>
            <BankingPanel />
          </FloatingPanel>

          <FloatingPanel id="competitor" index={8} title="Market" icon={<BarChart3 className="w-4 h-4 text-amber" />} accent="#B7791F">
            <MarketPanel />
          </FloatingPanel>

          <FloatingPanel id="marketing" index={9} title="Brand" icon={<Megaphone className="w-4 h-4 text-red" />} accent="#D1453B">
            <MarketingPanel />
          </FloatingPanel>

          <FloatingPanel id="research" index={10} title="R&D" icon={<Microscope className="w-4 h-4 text-indigo" />} accent="#4F5EFF">
            <ResearchPanel />
          </FloatingPanel>

          <FloatingPanel id="investor" index={11} title="Investor Relations" icon={<Handshake className="w-4 h-4 text-indigo" />} accent="#4F5EFF">
            <InvestorRelationsPanel />
          </FloatingPanel>

          <FloatingPanel id="wealth" index={12} title="Wealth" icon={<Wallet className="w-4 h-4 text-green" />} accent="#17A366">
            <WealthPanel />
          </FloatingPanel>

          <FloatingPanel id="dev" index={13} title="Dev Panel" icon={<Bug className="w-4 h-4 text-amber" />} accent="#D1453B">
            <DevPanel />
          </FloatingPanel>
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
      {showCompanyPrompt && (
        <div className="fixed inset-0 z-[200] bg-black/40 flex items-center justify-center">
          <div className="bg-surface border border-border rounded-xl p-6 w-80 shadow-xl">
            <h3 className="text-sm font-bold text-ink mb-1">Name Your Company</h3>
            <p className="text-[11px] text-ink-soft mb-4">This save doesn't have a company name yet. What should we call it?</p>
            <input
              type="text"
              value={companyInput}
              onChange={e => setCompanyInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && companyInput.trim()) { useGameStore.setState({ companyName: companyInput.trim() }); setShowCompanyPrompt(false); } }}
              placeholder="Enter company name..."
              maxLength={30}
              autoFocus
              className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs text-ink placeholder:text-ink-soft outline-none focus:border-indigo transition-colors mb-3"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowCompanyPrompt(false)}
                className="px-3 py-1.5 text-[10px] font-semibold text-ink-soft hover:text-ink transition-colors cursor-pointer rounded-lg">
                Skip
              </button>
              <button onClick={() => { if (companyInput.trim()) { useGameStore.setState({ companyName: companyInput.trim() }); setShowCompanyPrompt(false); } }}
                className="px-4 py-1.5 text-[10px] font-semibold bg-indigo text-white rounded-lg hover:bg-indigo/90 transition-colors cursor-pointer disabled:opacity-50"
                disabled={!companyInput.trim()}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <EventBanner />
      <TakeoverCapitalBanner />
    </div>
  );
}

export default App;