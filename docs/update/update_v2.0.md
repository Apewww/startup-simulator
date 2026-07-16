# v2.0 — Depth Update

## R&D / Tech Tree
- 12 research nodes across 4 tiers, 4 categories
- **Level-based progression**: tiap node punya 4 level, tiap level butuh `baseTicks × (1 + (level-1) × 0.5)` ticks
- Partial effect per level: `fullEffect × (level / maxLevel)`
- Developer idle → assign ke research → progress per tick
- Effects wired ke: traffic_mult, cohesion_bonus, churn_reduction, revenue_mult (ad/sub), brand_mult, server_efficiency, dev_speed_mult

### 12 Nodes
| Node | Tier | Category | Full Effect |
|------|------|----------|-------------|
| Efficient Coding | T1 | Infrastructure | Dev speed +10% |
| UI Framework | T1 | Platform | Traffic +10% |
| Ad Optimization | T1 | Monetization | Ad rev +10% |
| Distributed Systems | T2 | Infrastructure | Server cap +20% |
| User Analytics | T2 | Platform | Cohesion +0.05 |
| Programmatic Ads | T2 | Monetization | Ad rev +20% |
| Edge Computing | T3 | Infrastructure | Traffic +15% |
| Recommendation Engine | T3 | AI & Data | Cohesion +0.1, Traffic +15% |
| Subscription Plus | T3 | Monetization | Sub rev +25% |
| Quantum Indexing | T4 | Platform | Traffic +30% |
| Deep Personalization AI | T4 | AI & Data | Churn -50%, Cohesion +0.15 |
| Market Intelligence | T4 | AI & Data | Brand +30%, Churn -20% |

## Investor Relations
- **Board satisfaction** (0-100%) berdasarkan user, revenue, growth, uptime, brand, cohesion
- **Quarterly targets** generate di awal kuartal, evaluate otomatis tiap 3 bulan
- Met targets → cash reward; miss → -satisfaction
- **Term sheet**: investor offer periodik (amount, equity%, board seats, vesting, veto rights)
- 3 investor personalities (hands_on, passive, strategic)
- Funding existing dipindah ke panel Investor Relations

## v2.0.5 — Personal Wealth & Achievement

### Personal Wealth
- `personalCash` — uang pribadi player (terpisah dari company cash)
- Withdrawal: `maxWithdraw = companyCash × (ownership / 100)`
- Ownership calculated from `totalEquityGiven`: `max(20, 100 - totalEquityGiven)`
- Withdrawal triggers achievement check

### Achievement / Title System
- 7 titles: Hustler ($100K), Founder ($500K), Tycoon ($1M), Mogul ($5M), Millionaire ($10M), Multi-Millionaire ($100M), Billionaire ($1B)
- Tampil di Main Menu, HUD bar
- Pure prestige (belum ada efek gameplay)

### Board Satisfaction Consequences
- <40% → forced term sheet (compulsory funding, board demands capital injection)
- <20% → hostile takeover warning notification

### Equity Consequences
- >50% equity given → board control warning notification

### New Files
- `src/types/wealth.ts`, `src/data/achievements.ts`, `src/systems/wealth.ts`
- `src/components/WealthPanel.tsx`, `src/systems/globalAchievements.ts`

### Modified
- `gameStore.ts` — personalCash, lifetimeWithdrawn, unlockedTitles, victoryAchieved; withdrawPersonal action; board satisfaction/equity consequences in tick
- `Dock.tsx` — +Wealth button
- `App.tsx` — +Wealth FloatingPanel
- `HudBar.tsx` — personal cash + title icon display
- `MainMenu.tsx` — achievement grid section
- `DevPanel.tsx` — +Wealth cheats
- `gameDB.ts` — v17, `saveLoad.ts` — persist new state
- Research refactor: 1 level = 1 research session (no auto-chain), per-level Dev Lv./cost/ticks requirements

### v2.0 Fixes (post-release)
- **Bankrupt trigger**: changed from `cashAfter < 0` to `cashChange < 0` — bankrupt only if consistently losing money (revenue < expenses), not just when cash is low
- **Research cost scaling**: `baseCost × (0.5 + (level-1) × 0.35)` per level
- **Achievement popup**: button in Main Menu → popup list with icon, name, description, requirement
- **Global achievement persistence**: localStorage cross-save tracker — achievements sync across all save slots
- **Achievement descriptions**: added how-to info to each achievement

## All Changes (v2.0 + v2.0.5)
- `src/types/research.ts` — level-based research types
- `src/data/research.ts` — 12 nodes with maxLevel
- `src/systems/research.ts` — 1 level per session, per-level requirements
- `src/types/investorRelations.ts` — board, quarterly, term sheet types
- `src/systems/investorRelations.ts` — target gen, evaluation, term sheet gen
- `src/store/gameStore.ts` — new state, actions, tick integration, effect wiring, board/equity consequences
- `src/components/ResearchPanel.tsx` — per-level upgrade buttons
- `src/components/InvestorRelationsPanel.tsx` — +funding section
- `src/components/Dock.tsx` — scrollable overflow, +Wealth
- `src/components/WealthPanel.tsx` — withdrawal + achievements UI
- `src/components/MainMenu.tsx` — achievement section
- `src/components/HudBar.tsx` — personal cash display
- `src/db/gameDB.ts` — v17
- `src/systems/saveLoad.ts` — persist all new state
- `src/systems/monetization.ts` — researchAdRevMult, researchSubRevMult
- `src/systems/marketing.ts` — calcBrandEffects researchBrandMult param
- Fix: duplicate cancelCampaign bug (v1.6 era)
