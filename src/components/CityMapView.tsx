import { useState } from 'react';
import { Building2, Server, ArrowUpRight, Plus, MapPin, Sparkles } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { soundManager } from '../systems/soundManager';

const OFFICE_TIERS_INFO = {
  1: { name: 'Small Startup Garage', cols: 4, rows: 4, maxEmp: 4, rent: 200, cost: 0 },
  2: { name: 'Medium Tech Floor', cols: 8, rows: 8, maxEmp: 16, rent: 1200, cost: 10000 },
  3: { name: 'High-Rise HQ Skyscraper', cols: 12, rows: 12, maxEmp: 36, rent: 5000, cost: 75000 },
};

const PLOT_TIERS_INFO = {
  1: { name: 'Small Server Closet', cols: 3, rows: 3, maxRacks: 4, rent: 500, cost: 0 },
  2: { name: 'Medium Data Center Facility', cols: 6, rows: 6, maxRacks: 16, rent: 2500, cost: 15000 },
  3: { name: 'Hyperscale Campus Data Center', cols: 10, rows: 10, maxRacks: 36, rent: 8000, cost: 60000 },
};

export function CityMapView() {
  const setActiveView = useGameStore((s) => s.setActiveView);
  const officeTier = (useGameStore((s) => s.officeTier) || 1) as 1 | 2 | 3;
  const upgradeOfficeTier = useGameStore((s) => s.upgradeOfficeTier);
  const employees = useGameStore((s) => s.employees);
  const plots = useGameStore((s) => s.plots);
  const racks = useGameStore((s) => s.racks);
  const buyPlot = useGameStore((s) => s.buyPlot);
  const upgradePlotTier = useGameStore((s) => s.upgradePlotTier);
  const cash = useGameStore((s) => s.cash);
  const companyName = useGameStore((s) => s.companyName);

  const [activeTab, setActiveTab] = useState<'all' | 'hq' | 'datacenter'>('all');

  const currentOfficeInfo = OFFICE_TIERS_INFO[officeTier];
  const nextOfficeTier = (officeTier < 3 ? officeTier + 1 : null) as 2 | 3 | null;
  const nextOfficeInfo = nextOfficeTier ? OFFICE_TIERS_INFO[nextOfficeTier] : null;

  const handleEnterOffice = () => {
    soundManager.playClick();
    setActiveView({ type: 'office' });
  };

  const handleEnterServer = (plotId: string) => {
    soundManager.playClick();
    setActiveView({ type: 'server', plotId });
  };

  const handleUpgradeOffice = () => {
    if (!nextOfficeInfo || cash < nextOfficeInfo.cost) return;
    soundManager.playSuccess();
    upgradeOfficeTier();
  };

  const handleBuyPlot = () => {
    if (cash < 1500) return;
    soundManager.playSuccess();
    buyPlot();
  };

  return (
    <div className="flex-1 flex flex-col gap-4 p-4 min-h-0 overflow-y-auto select-none">
      {/* City World Map Header Banner */}
      <div className="relative rounded-2xl overflow-hidden border border-border shadow-lg bg-slate-950 min-h-[160px] flex flex-col justify-end p-6">
        <img
          src="/assets/city_world_map_bg_1785636956800.png"
          alt="City World Map"
          className="absolute inset-0 w-full h-full object-cover opacity-40 blur-xs"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />

        <div className="relative z-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Peta Kota Tech City
              </span>
              <span className="text-xs text-ink-soft">• {companyName || 'Startup Corp'}</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">World City Map Overview</h1>
            <p className="text-xs text-slate-400 mt-0.5">Kelola lokasi Kantor Utama (HQ) dan kawasan Data Center milik perusahaan Anda.</p>
          </div>

          {/* Quick Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-900/80 backdrop-blur border border-white/10 rounded-xl">
            <button
              onClick={() => { soundManager.playClick(); setActiveTab('all'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${activeTab === 'all' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              Semua Lokasi
            </button>
            <button
              onClick={() => { soundManager.playClick(); setActiveTab('hq'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${activeTab === 'hq' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              Kantor (HQ)
            </button>
            <button
              onClick={() => { soundManager.playClick(); setActiveTab('datacenter'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${activeTab === 'datacenter' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              Data Center ({plots.length})
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid of Building Locations */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {/* 1. KANTOR UTAMA (HEADQUARTERS LOCATION CARD) */}
        {(activeTab === 'all' || activeTab === 'hq') && (
          <div className="card p-5 border-2 border-indigo-500/30 bg-surface/90 backdrop-blur flex flex-col justify-between space-y-4 hover:border-indigo transition-all duration-200">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo border border-indigo-500/20">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-ink">Kantor Utama (HQ)</h3>
                    <span className="text-[10px] font-semibold text-indigo bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                      Tier {officeTier}: {currentOfficeInfo.name}
                    </span>
                  </div>
                </div>
                <MapPin className="w-4 h-4 text-indigo shrink-0" />
              </div>

              {/* Office Specs Grid */}
              <div className="grid grid-cols-2 gap-2 bg-surface-2 p-3 rounded-xl border border-border text-xs mb-3">
                <div>
                  <div className="text-[10px] text-ink-soft uppercase font-semibold">Ukuran Grid</div>
                  <div className="font-bold text-ink">{currentOfficeInfo.cols}x{currentOfficeInfo.rows} Tile</div>
                </div>
                <div>
                  <div className="text-[10px] text-ink-soft uppercase font-semibold">Kapasitas Tim</div>
                  <div className="font-bold text-ink">{employees.length} / {currentOfficeInfo.maxEmp} Karyawan</div>
                </div>
                <div className="col-span-2 pt-1 border-t border-border flex justify-between text-[11px]">
                  <span className="text-ink-soft">Sewa Kantor:</span>
                  <span className="font-semibold text-red">${currentOfficeInfo.rent}/bulan</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={handleEnterOffice}
                className="w-full py-2 px-4 bg-indigo hover:bg-indigo/90 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all hover:translate-y-[-1px]"
              >
                Masuk ke Viewport Kantor <ArrowUpRight className="w-4 h-4" />
              </button>

              {nextOfficeInfo && (
                <button
                  onClick={handleUpgradeOffice}
                  disabled={cash < nextOfficeInfo.cost}
                  className="w-full py-2 px-3 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo border border-indigo-500/30 rounded-xl text-xs font-semibold flex items-center justify-between cursor-pointer disabled:opacity-40 transition-colors"
                >
                  <span>Upgrade ke Tier {nextOfficeTier} ({nextOfficeInfo.name})</span>
                  <span className="font-bold">${nextOfficeInfo.cost.toLocaleString()}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* 2. DATA CENTER PLOTS LOCATION CARDS */}
        {(activeTab === 'all' || activeTab === 'datacenter') && (
          <>
            {plots.map((plot, index) => {
              const plotRacks = racks.filter(r => r.plotId === plot.id);
              const totalNodes = plotRacks.reduce((s, r) => s + r.slots.filter(sl => sl.node).length, 0);
              const pTier = (plot.tier || 1) as 1 | 2 | 3;
              const pInfo = PLOT_TIERS_INFO[pTier];
              const nextPlotTier = (pTier < 3 ? pTier + 1 : null) as 2 | 3 | null;
              const nextPlotInfo = nextPlotTier ? PLOT_TIERS_INFO[nextPlotTier] : null;

              return (
                <div key={plot.id} className="card p-5 border border-cyan-500/30 bg-surface/90 backdrop-blur flex flex-col justify-between space-y-4 hover:border-cyan-500 transition-all duration-200">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
                          <Server className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-ink">{plot.label}</h3>
                          <span className="text-[10px] font-semibold text-cyan-500 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                            Tier {pTier}: {pInfo.name}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-ink-soft">Plot #{index + 1}</span>
                    </div>

                    {/* Data Center Specs Grid */}
                    <div className="grid grid-cols-2 gap-2 bg-surface-2 p-3 rounded-xl border border-border text-xs mb-3">
                      <div>
                        <div className="text-[10px] text-ink-soft uppercase font-semibold">Ukuran Grid</div>
                        <div className="font-bold text-ink">{plot.gridCols}x{plot.gridRows} Tile</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-ink-soft uppercase font-semibold">Kapasitas Rak</div>
                        <div className="font-bold text-ink">{plotRacks.length} / {pInfo.maxRacks} Racks</div>
                      </div>
                      <div className="col-span-2 pt-1 border-t border-border flex justify-between text-[11px]">
                        <span className="text-ink-soft">Total Server Nodes:</span>
                        <span className="font-semibold text-cyan-500">{totalNodes} Nodes Terpasang</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={() => handleEnterServer(plot.id)}
                      className="w-full py-2 px-4 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all hover:translate-y-[-1px]"
                    >
                      Masuk ke Ruang Server <ArrowUpRight className="w-4 h-4" />
                    </button>

                    {nextPlotInfo && (
                      <button
                        onClick={() => upgradePlotTier(plot.id)}
                        disabled={cash < nextPlotInfo.cost}
                        className="w-full py-2 px-3 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-500 border border-cyan-500/30 rounded-xl text-xs font-semibold flex items-center justify-between cursor-pointer disabled:opacity-40 transition-colors"
                      >
                        <span>Upgrade ke Tier {nextPlotTier} ({nextPlotInfo.name})</span>
                        <span className="font-bold">${nextPlotInfo.cost.toLocaleString()}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* CARD MEMBELI LAHAN DATA CENTER BARU */}
            <div className="card p-5 border-2 border-dashed border-border bg-surface-2/50 backdrop-blur flex flex-col justify-center items-center text-center space-y-3 min-h-[220px]">
              <div className="p-3 rounded-full bg-green-500/10 text-green border border-green-500/20">
                <Plus className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-ink">Beli Plot Data Center Baru</h3>
                <p className="text-xs text-ink-soft max-w-xs mt-1">Perluas infrastruktur server untuk menampung traffic jutaan pengguna.</p>
              </div>
              <button
                onClick={handleBuyPlot}
                disabled={cash < 1500}
                className="py-2 px-5 bg-green hover:bg-green/90 text-white font-semibold rounded-xl text-xs cursor-pointer shadow-sm transition-colors disabled:opacity-40"
              >
                Beli Plot Baru ($1,500)
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
