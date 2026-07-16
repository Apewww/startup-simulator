# Update V2.1 — Market Update

**Induk:** `docs/upcoming_features v4.md` — Fase C (v2.1)
**Tujuan:** Leaderboard 1000 produk + Stock Market + IPO + Akuisisi + Cross-Investment
**Status:** ✅ Done

---

## Sub-Tahap Build (urutan ketat karena saling bergantung)

### a) Leaderboard 1000 Produk (Ranking Read-Only, read-only dulu, belum ada saham)
- [x] Perluas ranking dari 8+N → 1000 slot leaderboard (`MAX_RANK = 1000`)
- [ ] Komposisi: produk player + kompetitor AI existing + kompetitor baru (spawn dinamis)
- [ ] Ranking dihitung ulang tiap bulan in-game berdasarkan **Valuation Score**
- [ ] Update UI `CompetitorPanel.tsx`: default show top 20 + posisi player + neighbor ranks (bukan full scroll 1000)
- [ ] Slice data: hanya render rank terlihat + buffer (virtual scroll atau pagination)

### b) Formula Valuasi + Delisting/Spawn Logic
- [x] Implementasi formula valuasi baru:
  ```
  Valuation = (MonthlyRevenue × 12 × RevenueMultiple)
            + (currentUsers × UserValueFactor)
            × cohesionScore
            × growthMomentum
  ```
- [ ] `RevenueMultiple` & `UserValueFactor` per sector (social_media / ecommerce / search_engine)
- [ ] `growthMomentum` = rasio pertumbuhan users 3 bulan terakhir
- [ ] Update `updateCompetitorValuation()` — pakai formula baru, tidak hanya growth stokastik
- [ ] Update valuasi player product pakai formula yang sama (konsisten)
- [ ] Delisting: valuasi turun >70% dalam 6 bulan → delisted, slot leaderboard kosong
- [ ] Spawn dinamis: tiap bulan chance spawn, dipengaruhi:
  - Kategori "hot" (rata-rata growth tinggi) → spawn rate naik
  - Slot kosong (hasil delisting) → prioritas diisi
- [ ] Trait "Unicorn Candidate" — growth tinggi, volatility tinggi

### c) Stock Market Panel (Player → Kompetitor, Satu Arah)
- [ ] Data model: `MarketProduct` — perluas `CompetitorProduct` dengan:
  - `sharePrice: number`
  - `totalShares: number` (total 100% dipecah jadi unit saham)
  - `ownership: OwnershipStake[]`
- [ ] Type `OwnershipStake` — `ownerId` + `percentage`
- [ ] Kalkulasi `sharePrice = valuation / totalShares`
- [ ] UI `StockMarketPanel.tsx` — daftar produk AI di leaderboard:
  - Harga saham, % kepemilikan tersedia
  - Tombol Buy/Sell per produk
  - Mini chart riwayat harga (opsional, data array harga per bulan)
- [ ] Action `buyShares(productId, amount)` — kurangi cash player, tambah ownership
- [ ] Action `sellShares(productId, amount)` — balikin ke cash player, kurangi ownership

### d) Ownership & Dividend System
- [ ] Dividend payout periodik (tiap bulan):
  - `dividend = monthlyRevenue × (ownershipPct / 100)`
  - Player receives dividend dari produk yang diinvestasi
- [ ] UI `PortfolioPanel.tsx`:
  - Daftar produk yang sudah diinvestasi/diakuisisi player
  - % kepemilikan, dividend tracker (total diterima)
  - Passive income summary (total dividend/bulan)
- [ ] Dividend masuk sebagai revenue line item di FinancePanel

### e) Distress Trigger + AI Investment Logic (Kompetitor → Player, Dua Arah)
- [ ] **Distress Trigger** — player kehilangan proteksi 20% floor saat:
  - Cash negatif ≥3 bulan berturut-turut
  - `cohesionScore` <30% selama ≥60 tick
  - `currentUsers` churn tinggi ≥3 bulan
- [ ] AI Personality behavior untuk investasi ke player:
  - **Aggressive**: incar produk dengan distress trigger aktif, all-in buyback
  - **Conservative**: hanya investasi ke produk stabil/growing
  - **Opportunistic**: random weighted by undervaluation
- [ ] Di luar distress: AI bisa beli saham player max 80% (20% locked)
- [ ] Saat distress aktif: AI bisa beli melewati 20% floor menuju 100%
- [ ] UI `AcquisitionAlert.tsx` — notifikasi saat distress trigger aktif / akuisisi dimulai

### f) Full Acquisition Logic + Takeover Capital Pool
- [ ] 100% ownership oleh kompetitor → produk player **diakuisisi penuh**
- [ ] Kontrol pindah ke entity pengakuisisi
- [ ] Game over untuk produk itu, tapi player lanjut dengan **takeover capital**
- [ ] Player bisa beli saham produk AI sampai 100% → produk masuk portfolio player
- [ ] Produk yang diakuisisi penuh: passive income stream (revenue otomatis tiap bulan)
- [ ] UI `TakeoverCapitalBanner.tsx` — notifikasi capital hasil takeover
  - "Takeover Capital Available: $X — gunakan untuk luncurkan produk baru"
  - CTA "Buat Produk Baru"
- [ ] Capital di-earmark khusus untuk venture baru (pisah dari cash flow biasa)

---

## Data Model Baru

### Types (`src/types/competitor.ts` — perluas)
```ts
interface MarketProduct {
  id: string;
  name: string;
  sector: CompetitorSector;
  isPlayerOwned: boolean;
  valuation: number;
  sharePrice: number;
  totalShares: number;
  ownership: OwnershipStake[];
  growthRate: number;
  volatility: number;
  personality?: CompetitorPersonality;
  distressActive: boolean;
  rank: number;
  delisted: boolean;
}

interface OwnershipStake {
  ownerId: string;       // 'player' atau id produk AI lain
  percentage: number;    // 0-100
}

interface TakeoverEvent {
  targetProductId: string;
  buyerId: string;
  sharesAcquired: number;
  proceeds: number;
  timestamp: number;     // tick
}
```

### Store (`src/store/gameStore.ts`)
- State: `marketProducts: MarketProduct[]`, `takeoverCapital: number`, `distressActive: boolean`
- Actions: `buyShares`, `sellShares`, `payDividends`, `checkDistress`, `processTakeover`, `useTakeoverCapital`

---

## New Files

| File | Fungsi |
|------|--------|
| `src/components/StockMarketPanel.tsx` | Buy/sell saham, harga, mini chart, dividend tracker |
| `src/components/PortfolioPanel.tsx` | Daftar investasi player, passive income summary |
| `src/components/AcquisitionAlert.tsx` | Notifikasi distress / akuisisi berlangsung |
| `src/components/TakeoverCapitalBanner.tsx` | Banner capital hasil takeover + CTA venture baru |

## Modified Files

| File | Perubahan |
|------|----------|
| `src/types/competitor.ts` | +MarketProduct, OwnershipStake, TakeoverEvent; perluas CompetitorProduct |
| `src/types/index.ts` | Barrel export baru |
| `src/systems/competitor.ts` | Formula valuasi baru, delisting logic, spawn logic, AI investment logic |
| `src/systems/market.ts` | **BARU** — dividend payout, distress check, takeover processing |
| `src/store/gameStore.ts` | +marketProducts, +takeoverCapital, +distressActive; actions buy/sell/dividend/distress/takeover |
| `src/components/CompetitorPanel.tsx` | Perluas ke 1000 rank, virtual scroll / pagination |
| `src/components/Dock.tsx` | +Stock Market, +Portfolio buttons |
| `src/components/FinancePanel.tsx` | +Dividend income line, +Takeover capital line |
| `src/components/WealthPanel.tsx` | Update withdrawal calc pakai ownership dari saham |
| `src/components/HudBar.tsx` | +Distress warning indicator |
| `src/db/gameDB.ts` | Dexie v18 + new fields |
| `src/systems/saveLoad.ts` | Persist marketProducts, takeoverCapital, distressActive |

---

## UI/UX Baru

| Komponen | Fungsi |
|---|---|
| `StockMarketPanel.tsx` | Daftar produk + harga saham + Buy/Sell |
| `PortfolioPanel.tsx` | Investasi player + dividend summary |
| `AcquisitionAlert.tsx` | Notifikasi distress/akuisisi |
| `TakeoverCapitalBanner.tsx` | Banner capital + CTA venture baru |

---

## Checklist

- [x] Leaderboard 1000 slot (read-only) — top 20 + player neighbor + Show All toggle
- [x] Formula valuasi baru (RevenueMultiple, UserValueFactor, growthMomentum via userHistory)
- [x] Delisting (70% user drop over tracked period)
- [x] Spawn dinamis (hot sector, slot kosong, Unicorn trait)
- [x] StockMarketPanel — buy/sell saham ke AI competitors
- [x] Ownership & dividend system — monthly dividend payout
- [x] Distress trigger check (cash, cohesion, churn) — 60 tick threshold
- [x] AI investment logic (3 personality: aggressive/conservative/opportunistic)
- [x] Full acquisition (100% ownership → game over + takeover capital)
- [x] Takeover capital pool + banner + venture CTA
- [x] Portfolio panel — daftar investasi player + dividend tracker
- [x] AcquisitionAlert — distress indicator in HUD
- [x] Dexie v18 + save/load semua state baru
- [x] Build sukses (tsc -b + vite build)

---

## Dependency Check

Fitur ini dibangun di atas fondasi:
- ✅ Competitor AI (v1.9) — entity untuk diperdagangkan
- ✅ Marketing & Branding (v1.9) — brand memengaruhi valuasi
- ✅ Market Events (v1.9) — boom/crash/gold rush pengaruh market
- ✅ Funding/Investor Relations (v2.0) — equity distribution
- ✅ Personal Wealth & Achievement (v2.0.5) — ownership % batasi withdrawal
- ✅ Board satisfaction (v2.0.5) — distress trigger terkait board

Sebelum:
- v2.2 — Multi-Product Portfolio (butuh mekanisme saham yang matang)
- v2.3 — Endgame (butuh stock market sebagai komponen win condition)

---

*Dokumen ini adalah working spec, akan diperbarui seiring progress implementasi.*
