# Update V1.9 — Competition Era

**Induk:** `docs/upcoming_features v4.md` — Fase A (v1.9)
**Tujuan:** Competitor AI dasar + Marketing & Branding System

---

## V1.9 Features

### 1. Competitor AI System
- 8 competitor AI spawn saat game start (product select)
- Growth stokastik tiap bulan: `valuation × (1 + growthRate + noise(±volatility))`
- 3 personality: aggressive (high growth, high volatility), conservative (low), opportunistic (medium)
- Delisting: valuation turun >70% dalam 6 bulan → delisted
- Spawn dinamis: tiap bulan ada chance 15-25% competitor baru masuk
- Ranking 1000 (display top 50)
- Market events: boom (×1.3), crash (×0.7), sector gold rush

### 2. Leaderboard (Market Panel)
- Merged list: player + AI competitors, sorted by valuation
- 🥇/🥈/🥉 medal untuk top 3
- Hot sector badge (🔥) pada competitor yang spawn saat gold rush
- Player di luar top 50 → sticky bottom card
- Sector label + colored dot + trend arrow per entry

### 3. Marketing & Branding System
- BrandScore (0-100), decay 0.1/tick tanpa campaign
- 4 campaign types: Social Media Blitz, Brand Awareness, PR Campaign, Viral Marketing
- Efek ke user growth (×1.1-1.2), churn reduction, mood bonus
- Campaign cost tercatat di monthly expense breakdown

### 4. Market Events (Platform-Level)
- `market_boom` (120 tick): all competitor growth ×1.3, player user growth ×1.3
- `market_crash` (180 tick): all competitor growth ×0.7, player growth ×0.6, revenue ×0.7
- `sector_gold_rush` (90 tick): spawn bias + growth bonus untuk 1 sector, player user growth ×1.15
- Hanya bisa trigger setelah month ≥3

### 5. Multi-Save System
- Save slots 1-10, slot ID sequential (bukan timestamp)
- Main menu list saves: month, cash, users, product, timestamp
- Delete per slot
- Auto-save pakai currentSlotId
- Game over → delete current slot

### 6. Company Name
- Input company name + CEO name di PlayerSetup
- Nama perusahaan tampil di leaderboard

### 7. Dev Panel (Floating Panel)
- Pindah dari fixed overlay ke FloatingPanel (drag, minimize, close)
- Tombol DEV di Dock (muncul saat devMode on)
- Cheat: Spawn Competitor, Max Brand, Reset Competitors, Trigger Hot Sector

---

## Bugfixes

| Bug | Fix |
|-----|-----|
| Event trigger tanpa platform aktif | Guard `hasActiveFeatures` sebelum `checkEventTrigger` |
| White screen dev button | Import `Bug` icon + FloatingPanel selalu render |
| Hot sector crash di EventBanner | Tambah `market_boom`/`crash`/`gold_rush` di EVENT_ICONS/COLORS |
| Campaign cost tidak di expense | `campaignCostThisMonth` accumulator + include di monthly billing |
| Old save tanpa competitor | Seed `generateInitialCompetitors()` di tick pertama |
| Circular dependency | Pindah `TICKS_PER_DAY/MONTH` ke `src/constants.ts` |
| Leaderboard rank player | Player masuk sebagai entry list, bukan card terpisah |

---

## Files Changed

| File | Perubahan |
|------|----------|
| `src/types/competitor.ts` | BARU: CompetitorProduct + hotSectorBadgeTicks |
| `src/types/marketing.ts` | BARU: MarketingCampaign, BrandMetrics |
| `src/types/event.ts` | +3 event types + HotSector |
| `src/types/index.ts` | Barrel export baru |
| `src/constants.ts` | BARU: TICKS_PER_DAY, TICKS_PER_MONTH |
| `src/data/competitorNames.ts` | BARU: 30 nama AI |
| `src/data/marketing.ts` | BARU: 4 campaign defs |
| `src/systems/competitor.ts` | BARU: generate, update, delist, spawn, ranking |
| `src/systems/marketing.ts` | BARU: create, process, brand decay/effects |
| `src/systems/events.ts` | +3 market event templates + trigger + getHotSector |
| `src/systems/adSales.ts` | Fix circular import → constants.ts |
| `src/systems/saveLoad.ts` | Multi-save + companyName + campaignCostThisMonth |
| `src/store/gameStore.ts` | +state (competitors, marketing, brand, campaignCost, slotId, companyName) + actions + tick integration |
| `src/db/gameDB.ts` | Dexie v15 + field baru |
| `src/components/CompetitorPanel.tsx` | BARU: leaderboard merged list |
| `src/components/MarketingPanel.tsx` | BARU: campaign management |
| `src/components/MainMenu.tsx` | Multi-save slot UI |
| `src/components/PlayerSetup.tsx` | +Company name input |
| `src/components/DevPanel.tsx` | FloatingPanel content + hot sector trigger |
| `src/components/Dock.tsx` | +Market, Brand, Dev buttons |
| `src/components/HudBar.tsx` | Brand indicator, compact layout |
| `src/components/EventBanner.tsx` | Market event icons/colors |
| `src/components/FinancePanel.tsx` | Campaign cost line item |
| `src/App.tsx` | +FloatingPanels (Market, Brand, Dev), autosave slot |

---

## Checklist

- [x] Competitor AI: spawn, growth, delist, ranking
- [x] Leaderboard: merged player + AI, top 3 medal, sticky bottom
- [x] Marketing: 4 campaign types, brand score, effects
- [x] Market events: boom, crash, gold rush
- [x] Hot sector badge pada competitor
- [x] Multi-save (slot 1-10)
- [x] Company name input
- [x] Dev Panel sebagai FloatingPanel
- [x] Campaign cost di FinancePanel expense
- [x] Old save migration (competitor seed)
- [x] Circular dependency fix (constants.ts)
- [x] Event guard (platform harus aktif)
- [x] Build sukses (`tsc -b` + `vite build`)
