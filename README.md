# Startup Simulator

Game simulasi manajemen startup teknologi berbasis desktop. Dibangun dengan Tauri + React + TypeScript. Terinspirasi dari *Startup Company* (Hovgaard Games).

---

## Tech Stack

| Layer | Teknologi |
|---|---|
| Frontend | React 19 + TypeScript |
| Desktop Shell | Tauri 2 |
| State Management | Zustand 5 |
| Styling | Tailwind CSS 4 |
| Save/Load | Dexie.js (IndexedDB) |
| Icons | Lucide React |
| Build Tool | Vite 8 |

---

## Cara Menjalankan

```bash
npm install
npm run dev          # Dev server (browser)
npm run tauri dev    # Desktop app
npm run tauri build  # Build .exe
```

---

## Fitur (v1.0 – v2.3)

| Versi | Fitur |
|---|---|
| v1.0–1.2 | Game loop, keuangan, karyawan, produksi komponen |
| v1.3 | Platform features, traffic/users, server rack+node+cooling, compliance |
| v1.4 | Lead Developer supervision, office grid modular, furniture system, perk points |
| v1.5 | Monetisasi rebalance (Ads Tier, B2B API, Subscription), cooling grid, SysAdmin tie-in |
| v1.6 | Ad Sales Pipeline (Ad Monetization Specialist, leads, campaign, auto-renew) |
| v1.7 | Pricing slider per produk, banking (loan, credit score) |
| v1.8 | Revenue visualization, deal notification, client history |
| v1.9 | Competitor AI, marketing & branding system |
| v2.0 | R&D Tech Tree, Investor Relations (board, term sheet), Personal Wealth & Titles |
| v2.1 | Leaderboard 1000 produk, Stock Market, Multi-AI funding, akuisisi |
| v2.2 | Multi-Product Portfolio, Global Expansion, RPS routing per rack |
| v2.3 | Endgame (Victory screen, New Game+), per-product valuation |

---

## Game Loop

Tick-based simulation via `setInterval(incrementTick, 2000 / speed)`:

- 1 tick = 1 jam in-game
- 20 tick = 1 hari, 600 tick = 1 bulan
- Speed 1x/2x/4x, bisa pause

Setiap tick:
1. Produksi komponen + training + happiness/resign
2. User pool dinamis, platform stats (cohesion/synergy)
3. Compliance check, water-fill RPS, overheat/crash
4. Event trigger (DDoS, traffic spike, PR crisis)
5. Marketing campaign progress, brand decay
6. Ad Sales: lead expiry, campaign progress, auto-renew
7. Setiap bulan: payroll, server cost, revenue, loan, quarterly board review
8. Setiap bulan: endgame rank check

---

## Struktur Project

```
src/
├── App.tsx                   # Root — routing (menu/select/setup/playing/victory/gameover)
├── main.tsx                  # Entry point
├── index.css                 # Global CSS + dark theme vars
│
├── components/               # ~30 UI components
│   ├── MainMenu.tsx          # Main menu + saved games + achievements
│   ├── HudBar.tsx            # Toolbar (cash, stats, speed, alerts)
│   ├── Dock.tsx              # Sidebar navigasi panel
│   ├── VictoryScreen.tsx     # Endgame victory screen
│   ├── MarketPanel.tsx       # Leaderboard + stock market
│   ├── WealthPanel.tsx       # Personal wealth + withdrawal + titles
│   ├── ProductBar.tsx        # Multi-product switcher
│   ├── ProductOverview.tsx   # Dashboard per produk
│   ├── RegionPanel.tsx       # Global expansion
│   ├── InvestorRelationsPanel.tsx  # Board + term sheet + AI funding
│   ├── ResearchPanel.tsx     # R&D Tech Tree
│   ├── MarketingPanel.tsx    # Brand campaigns
│   ├── AdSalesPanel.tsx      # Ad Sales pipeline
│   ├── ServerPanel.tsx       # Server racks + nodes
│   ├── ServerRoomView.tsx    # Grid rack placement
│   ├── ServerShop.tsx        # Buy rack/node/rental
│   ├── EmployeesPanel.tsx    # Karyawan: assign, train, vacation, supervise
│   ├── FeaturesPanel.tsx     # Platform features + monetization strategy
│   ├── FinancePanel.tsx      # Laporan keuangan + cash flow chart
│   ├── RecruitmentPanel.tsx  # Rekrutmen
│   ├── PerksPanel.tsx        # Perk points, milestones, furniture shop
│   ├── BankingPanel.tsx      # Loan
│   ├── OfficeGrid.tsx        # Kantor grid 2D
│   ├── CashFlowChart.tsx     # Bar chart inline SVG
│   ├── FloatingPanel.tsx     # Draggable window container
│   ├── DevPanel.tsx          # Cheat panel (dev mode)
│   └── ...                   # (smaller components)
│
├── store/
│   └── gameStore.ts          # Zustand — seluruh state & actions (3000+ line)
│
├── systems/                  # Business logic
│   ├── platform.ts           # Cohesion, synergy, event effects
│   ├── server.ts             # RPS distribution, heat, overheat, crash
│   ├── compliance.ts         # Hardware requirement point system
│   ├── events.ts             # Random events + hot sector
│   ├── monetization.ts       # Revenue formulas (ads, sub, B2B, pricing)
│   ├── recruitment.ts        # Applicant generation, negotiation
│   ├── adSales.ts            # Lead generation, campaign, auto-renew
│   ├── marketing.ts          # Brand campaigns, brand decay
│   ├── competitor.ts         # AI competitor simulation, valuation, ranking
│   ├── market.ts             # Stock market, dividend, takeover
│   ├── research.ts           # Tech tree R&D
│   ├── investorRelations.ts  # Board targets, term sheet
│   ├── wealth.ts             # Withdrawal, ownership, title
│   ├── banking.ts            # Loan, credit score
│   ├── regulatory.ts         # Regional compliance (GDPR-style)
│   ├── leadDeveloper.ts      # Supervision boost logic
│   ├── radiusEffect.ts       # Furniture radius effects
│   ├── productRouting.ts     # Per-product RPS routing
│   └── saveLoad.ts           # IndexedDB save/load (Dexie v19)
│
├── data/                     # Static data
│   ├── products.ts           # 3 produk definitions + features
│   ├── servers.ts            # Rack tiers, node types, cooling
│   ├── components.ts         # Software components + min level
│   ├── achievements.ts       # Wealth title definitions
│   ├── milestones.ts         # Perk point milestones
│   ├── perks.ts              # Perk definitions
│   ├── furniture.ts          # Furniture definitions
│   ├── regions.ts            # Global region definitions
│   ├── clientNames.ts        # Ad client names
│   ├── competitorNames.ts    # AI competitor names
│   └── research.ts           # Tech tree nodes
│
├── types/                    # TypeScript interfaces
│   ├── employee.ts           # Employee, Applicant, FundingRound
│   ├── feature.ts            # PlatformFeature, FeatureGroup
│   ├── event.ts              # GameEvent, EventType
│   ├── server.ts             # ServerNode, ServerRack, RentedServer
│   ├── resource.ts           # ComponentResource
│   ├── competitor.ts         # CompetitorProduct, CompetitorSector
│   ├── portfolio.ts          # ProductPortfolioState
│   ├── wealth.ts             # TitleId, WealthEntry, AchievementDef
│   ├── marketing.ts          # MarketingCampaign
│   ├── research.ts           # ActiveResearch
│   ├── investorRelations.ts  # BoardTarget, TermSheet, AiFundingOffer
│   ├── monetization.ts       # PricingTier, BusinessLoan
│   └── index.ts              # Barrel export
│
└── db/
    └── gameDB.ts             # Dexie schema (IndexedDB, v19)
```

---

## Endgame (v2.3)

Dua kondisi untuk unlock tombol "End Career" di WealthPanel (cukup salah satu):

1. **Rank #1 di leaderboard bertahan ≥3 bulan** (consecutive)
2. **Millionaire title** — personalCash ≥ $10,000,000

Saat unlock → klik End Career → Victory Screen:
- Stats (survived, team, peak users, company cash, personal wealth)
- Title badge + achievement "Game Completed" 🏆 (global)
- Opsi: **New Game+** (restart + title carry + $25K bonus), **Continue Playing**, **Main Menu**
- NG+ badge di Main Menu

Per-product valuation: tiap produk punya valuasi sendiri, combined untuk ranking.

---

## Karyawan

**Roles:** Developer, Designer, Lead_Developer, SysAdmin, HR, Ad_Monetization_Specialist

| Role | Fungsi |
|---|---|
| Designer | UI Component, Graphics Component, Brand Identity |
| Developer | Backend Code, Network Module, Security Protocol |
| Lead Developer | Supervisi Developer: boost output (soft diminishing return) |
| SysAdmin | Recovery crash, kurangi crash chance |
| HR | Recruitment boost |
| Ad Monetization Specialist | Cari client Ad, kelola campaign |

**Atribut:** level, happiness (0-100), speed, salary, currentTask, isTraining, onVacation
**Training:** `level × 400` tick
**Vacation:** 1-7 hari, happiness recovery
**Furniture:** Coffee Machine (-50% decay), Ergonomic Chair (overwork threshold 50→80), Water Dispenser (+0.15/tick idle)

---

## Server & Compliance

- **Rack:** Basic (4 slot/40 cooling), Advanced (6/80), Enterprise (8/150)
- **Node:** Web T1-4, DB T1-3, Cache T1-3, Router, Cooling Fan, Industrial Fan, Storage
- **Heat System:** node produce heat, rack cooling capacity, overheat → crash
- **Compliance:** Compute/Data/Network/Security point ratio → user cap & revenue mult
- **Cooling Grid:** heat spread antar rack bersebelahan; SysAdmin reduce spread
- **Rented Servers:** instant capacity, monthly cost

---

## Multi-Product & Global Expansion (v2.2)

- Pemain bisa punya ≥1 produk (Social Media, E-Commerce, Search Engine)
- Tiap produk punya state terpisah: users, features, monetisasi, brand, region
- Shared: cash, employees, racks, research, board
- Rack & rented server bisa di-assign ke produk tertentu
- **Global Expansion:** 6 region (NA, EU, AS, OC, SA, AF), masing-masing dengan compliance law

---

## Player Wealth & Titles

- Withdraw company cash ke personal (dibatasi ownership %)
- 7 title: Hustler → Founder → Tycoon → Mogul → Millionaire → Multi-Millionaire → Billionaire
- Title disimpan global (localStorage), terlihat di Main Menu
- Dual win condition: Rank #1 atau Billionaire
