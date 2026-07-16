# Update V2.1 — Market Update

**Induk:** `docs/upcoming_features v4.md` — Fase C (v2.1)
**Tujuan:** Leaderboard 1000 produk + Stock Market + Multi-AI Funding + Acquisition
**Status:** ✅ Done

---

## Final Feature List

### Leaderboard & Market
- Leaderboard 1000 slot — top 20 + player neighbor + Show All toggle
- Search filter di MarketPanel (Leaderboard + Stocks)
- Tab footer sticky: Leaderboard / Stocks

### Stock Market (Player → AI Competitors)
- Buy/sell shares AI competitors via personalCash
- Ownership progress bar + available shares %
- Live cost/proceeds display, max buy indicator
- No number spinners on input fields

### Own Company Shares
- Buyback own shares from AI via personalCash
- Proportional aiStakes reduction
- boardSatisfaction=100 + clear quarterlyTargets when fully owned

### Multi-AI Funding (replaces old single-investor)
- Every 6 months, 3-5 AI competitors offer 2-10% each based on valuation
- Company valuation must be ≥$100K to trigger
- Max total external ownership: 80% hard cap
- Offers shown in Board panel → Offers tab

### AI Stakeholder Demands
- AI with ≥20% stake generates forced dilution demand every 6 months
- 5-15% equity at 80% fair value price
- Appears as red DEMAND card in Board panel Offers tab

### Dividends
- Monthly dividend = Σ competitor.monthlyRevenue × (ownership% / 100)
- Goes to personalCash (not company cash)
- Achievement check on dividend receipt

### Wealth System
- WealthPanel tabs: Withdraw / Deposit / History / Portfolio / Titles
- Withdrawal: 1x per month, capped by ownership %
- Deposit: personalCash → company cash
- WealthLog: transaction history (withdraw, deposit, dividend, stock buy/sell)
- Portfolio: investment list with dividend tracker

### Board Panel (Investor Relations)
- Sticky footer tabs: Offers / History
- Offers tab: board satisfaction + quarterly targets + AI offers/demands
- History tab: quarterly reports + funding round history
- AI stakeholders summary

### Misc
- 100 initial competitors with scaled ranking ($100M → $50K)
- New spawns comparable to player valuation
- TICKS_PER_DAY=24, TICKS_PER_MONTH=720 (1 tick = 1 hour)
- Skip D/W/M/Y in Dev Panel → State tab
- Bankrupt: only when cash truly depleted (3mo losses + cash negative)
- try-catch incrementTick with console.error logging
- Old save migration for new competitor fields

### Removed
- Distress trigger & AI investment logic (aggressive/conservative/opportunistic)
- AcquisitionAlert component
- Old single-investor term sheet funding
- FundingPanel from Finance panel
- Portfolio as separate panel (merged into Wealth)
- Speed buttons from HUD (replaced by 1x/2x/4x restored later)

---

## New Files

| File | Fungsi |
|------|--------|
| `src/components/StockMarketPanel.tsx` | Buy/sell saham AI + own company buyback |
| `src/components/PortfolioPanel.tsx` | Investment list + dividend tracker (embedded in Wealth panel) |
| `src/components/MarketPanel.tsx` | Tab container: Leaderboard + Stocks + search |
| `src/components/TakeoverCapitalBanner.tsx` | Banner capital hasil takeover |
| `src/components/AcquisitionAlert.tsx` | (removed) |

## Modified Files

| File | Perubahan |
|------|----------|
| `src/types/competitor.ts` | +OwnershipStake, PlayerMarketEntry; perluas CompetitorProduct (totalShares, sharePrice, ownership, userHistory, isUnicorn) |
| `src/types/wealth.ts` | +WealthEntry, WealthEntryType |
| `src/types/investorRelations.ts` | +AiFundingOffer (type, demandLabel, expiresAtMonth) |
| `src/types/index.ts` | Barrel export baru |
| `src/constants.ts` | +MAX_RANK=1000; TICKS_PER_DAY=20→24; TICKS_PER_MONTH=600→720 |
| `src/systems/competitor.ts` | Formula valuasi baru, growthMomentum, generateInitialCompetitors(100), scaled ranking, targetValuation param, chooseSpawnSector, isUnicornSpawn |
| `src/systems/wealth.ts` | calcMaxWithdrawal, calcPlayerOwnership, getCurrentTitle |
| `src/systems/saveLoad.ts` | Persist semua state baru; old-save migration competitor fields |
| `src/store/gameStore.ts` | buyShares/sellShares (personalCash), depositToCompany, buybackShares (aiStakes+board reset), wealthLog, distress dihapus, AI investment logic dihapus, multi-AI funding generation, forced demand generation, try-catch tick, skipTicks action, pendingFunding dihapus |
| `src/db/gameDB.ts` | Dexie v18 + new fields |
| `src/components/CompetitorPanel.tsx` | 1000 rank, top20+player neighbor+Show All, search filter |
| `src/components/MarketPanel.tsx` | **BARU**: tab Leaderboard/Stocks + search + sticky footer |
| `src/components/StockMarketPanel.tsx` | **BARU**: buy/sell UI + own company buyback + live cost/max shares |
| `src/components/PortfolioPanel.tsx` | **BARU**: investment list + dividend tracker |
| `src/components/WealthPanel.tsx` | Refactor ke 5 tabs: Withdraw/Deposit/History/Portfolio/Titles |
| `src/components/InvestorRelationsPanel.tsx` | Refactor: sticky footer Offers/History tabs, AI stakeholders, AI offers + demands |
| `src/components/Dock.tsx` | Portfolio dihapus |
| `src/components/HudBar.tsx` | Speed 1x/2x/4x (skip dipindah ke DevPanel) |
| `src/components/DevPanel.tsx` | Skip D/W/M/Y di tab State |
| `src/components/FinancePanel.tsx` | Funding section dihapus |
| `src/App.tsx` | Portfolio/AcquisitionAlert dihapus, MarketPanel added |
| `src/components/FundingPanel.tsx` | (orphaned — no longer used) |

---

## Data Model (Final)

```ts
interface CompetitorProduct {
  id: string; name: string; sector: CompetitorSector;
  valuation: number; growthRate: number; volatility: number;
  personality: CompetitorPersonality;
  rank: number; delisted: boolean; delistedAtMonth: number;
  createdAtMonth: number; userCount: number; monthlyRevenue: number;
  hotSectorBadgeTicks: number; newBadgeTicks: number;
  userHistory: number[]; isUnicorn: boolean;
  totalShares: number; sharePrice: number;
  ownership: OwnershipStake[];
}

interface OwnershipStake {
  ownerId: string; percentage: number;
}

interface AiFundingOffer {
  id: string; aiId: string; aiName: string;
  amount: number; equityGiven: number;
  type: 'offer' | 'demand';
  demandLabel?: string; expiresAtMonth: number;
}

interface WealthEntry {
  type: 'withdraw' | 'deposit' | 'dividend' | 'stock_buy' | 'stock_sell';
  amount: number; personalCash: number; month: number;
}
```

---

## Checklist

- [x] Leaderboard 1000 slot (top20 + neighbor + Show All)
- [x] Search filter MarketPanel
- [x] Formula valuasi (RevenueMultiple, UserValueFactor, growthMomentum)
- [x] 100 initial competitors scaled ($100M → $50K)
- [x] Unicorn trait, delisting, hot sector spawn
- [x] StockMarketPanel — buy/sell AI shares (personalCash)
- [x] Own company buyback (aiStakes + board reset)
- [x] Ownership tracking + progress bar + available % + max buy indicator
- [x] No number spinners on input fields
- [x] Multi-AI funding (3-5 AI, 2-10% each, ≥$100K valuation)
- [x] Forced demands (AI ≥20%, every 6mo, dilution)
- [x] Investor Relations footer tabs (Offers/History)
- [x] WealthPanel 5 tabs (Withdraw/Deposit/History/Portfolio/Titles)
- [x] WealthLog transaction history
- [x] Deposit wealth → company
- [x] Dividend → personalCash + achievement check
- [x] Withdrawal 1x per month
- [x] Distress trigger removed, AI investment logic removed
- [x] Old FundingPanel removed, history moved to Board
- [x] Portfolio merged into Wealth (not standalone panel)
- [x] Skip D/W/M/Y in DevPanel State tab
- [x] Speed 1x/2x/4x in HUD
- [x] Bankrupt: 3mo losses + cash negative
- [x] TICKS_PER_DAY=24, TICKS_PER_MONTH=720
- [x] Old save migration + null guards
- [x] try-catch incrementTick + console.error
- [x] Dexie v18 save/load
- [x] Build sukses (tsc -b + vite build)
