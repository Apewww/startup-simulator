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
- Spawn dinamis: tiap bulan chance 15-25% (tergantung kepadatan market), max 100 active
- Combinatorial name generator: 50 prefix × 48 suffix = 2,400+ unique names
- **NEW badge** (biru) untuk competitor yang baru spawn, bertahan ~2 bulan
- Row background: biru muda = new spawn, oranye = hot sector spawn, amber = top 3

### 2. Leaderboard (Market Panel)
- Merged list: player + AI competitors, sorted by valuation
- Player **hanya masuk ranking** kalau `currentUsers > 0` (valuasi = users × 80)
- 🥇/🥈/🥉 medal dengan background hierarki (#1 paling menonjol)
- NEW badge + Flame icon untuk hot sector
- Sector label hanya muncul saat panel **maximized**
- Player di luar top 50 → sticky bottom card
- Colored dot (sector) + trend color (green/red valuation text, tanpa arrow icon)

### 3. Marketing & Branding System
- BrandScore (0-100), decay 0.1/tick tanpa campaign
- 4 campaign types: Social Media Blitz, Brand Awareness, PR Campaign, Viral Marketing
- Efek ke user growth (×1.1-1.2), churn reduction, mood bonus
- Campaign cost tercatat di monthly expense breakdown
- Hanya 1 active campaign dalam satu waktu

### 4. Market Events (Platform-Level)
- `market_boom` (120 tick): all competitor growth ×1.3, player user growth ×1.3
- `market_crash` (180 tick): all competitor growth ×0.7, player growth ×0.6, revenue ×0.7
- `sector_gold_rush` (90 tick): spawn bias + growth bonus 0.05/bulan untuk 1 sector, player user growth ×1.15
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
- Old save tanpa company name → prompt modal "Name Your Company" saat load

### 7. Dev Panel (Floating Panel)
- Pindah dari fixed overlay ke FloatingPanel (drag, minimize, close)
- Tombol DEV di Dock (muncul saat devMode on)
- **Tab UI**: 5 tabs (Core, Team, Server, Market, State) — no more scrolling
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
| Duplicate competitor names | `deduplicateNames()` di load + tiap tick + combinatorial name generator |
| Old save company name kosong | Modal prompt setelah load game |
| Player ranking tanpa user | Valuasi = 0 kalau users = 0 (tidak masuk leaderboard) |

---

## Files Changed

| File | Perubahan |
|------|----------|
| `src/types/competitor.ts` | BARU: CompetitorProduct + hotSectorBadgeTicks + newBadgeTicks |
| `src/types/marketing.ts` | BARU: MarketingCampaign, BrandMetrics |
| `src/types/event.ts` | +3 event types + HotSector |
| `src/types/index.ts` | Barrel export baru |
| `src/constants.ts` | BARU: TICKS_PER_DAY, TICKS_PER_MONTH |
| `src/data/competitorNames.ts` | BARU: combinatorial generator (50 prefix × 48 suffix) |
| `src/data/marketing.ts` | BARU: 4 campaign defs |
| `src/systems/competitor.ts` | BARU: generate, update, delist, spawn, ranking, deduplicate |
| `src/systems/marketing.ts` | BARU: create, process, brand decay/effects |
| `src/systems/events.ts` | +3 market event templates + trigger + getHotSector |
| `src/systems/adSales.ts` | Fix circular import → constants.ts |
| `src/systems/saveLoad.ts` | Multi-save + companyName + dedup on load + computeRankings on load |
| `src/store/gameStore.ts` | +state (competitors, marketing, brand, campaignCost, slotId, companyName) + actions + tick integration |
| `src/db/gameDB.ts` | Dexie v15 + field baru |
| `src/components/CompetitorPanel.tsx` | BARU: merged leaderboard, top 3 hierarchy, row backgrounds, player only with users |
| `src/components/MarketingPanel.tsx` | BARU: campaign management |
| `src/components/MainMenu.tsx` | Multi-save slot UI |
| `src/components/PlayerSetup.tsx` | +Company name input |
| `src/components/DevPanel.tsx` | FloatingPanel content + tab UI (5 tabs) |
| `src/components/Dock.tsx` | +Market, Brand, Dev buttons |
| `src/components/HudBar.tsx` | Brand indicator, compact layout, date format |
| `src/components/EventBanner.tsx` | Market event icons/colors |
| `src/components/FinancePanel.tsx` | Campaign cost line item |
| `src/App.tsx` | +FloatingPanels (Market, Brand, Dev), autosave slot, company prompt modal |

---

## Checklist

- [x] Competitor AI: spawn, growth, delist, ranking, dedup
- [x] Leaderboard: merged player + AI, top 3 medal/hierarchy, sticky bottom
- [x] Marketing: 4 campaign types, brand score, effects
- [x] Market events: boom, crash, gold rush
- [x] Hot sector badge + new spawn badge (row background)
- [x] Multi-save (slot 1-10)
- [x] Company name input + old save prompt
- [x] Dev Panel sebagai FloatingPanel + tab UI
- [x] Campaign cost di FinancePanel expense
- [x] Old save migration (competitor seed + dedup + company name prompt)
- [x] Circular dependency fix (constants.ts)
- [x] Event guard (platform harus aktif)
- [x] Combinatorial name generator (2400+ unique)
- [x] Player only ranks with users > 0
- [x] Build sukses (`tsc -b` + `vite build`)

---

## Commits (7 total)

```
6cb672a v1.9: player only ranks when users > 0 (realistic valuation)
faad17e v1.9: ranking fix, dedup on load, player valuation formula, dev panel tabs
9d20763 v1.9: row background untuk new & hot sector competitor
65dc46d v1.9: deduplicate competitor names on load (fix old save dupes)
7cbe3fd v1.9: combinatorial name generator (prefix+suffix, 2400+ uniq)
660cd0c v1.9: sector label hanya di fullscreen + 25 nama competitor baru
324a9a5 v1.9: NEW badge untuk competitor baru (3 hari)
1afdb31 v1.9: leaderboard redesign, company name, hot sector badge, HUD date fix, docs
8790e40 v1.9: App integration - floating panels, main menu multi-save
cbca13c v1.9: UI components - leaderboard, marketing panel, HUD, dock, dev panel
de3cc45 v1.9: store integration - competitor/marketing state, multi-save, campaign expense
19713d1 v1.9: add competitor & marketing systems, market events
cee89fd v1.9: add competitor & marketing types, data, constants
```
