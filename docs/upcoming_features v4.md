# Upcoming Feature — "Market & Competition Era" (v1.9 - v2.3 + Wealth & Legacy)

Dokumen roadmap & spec konsep untuk update besar berikutnya Startup Simulator, melanjutkan dari v1.8 (terakhir selesai). Fokus utama: mengubah "Kompetitor AI" (yang sebelumnya cuma 📝 Planned) menjadi ekosistem penuh: leaderboard 1000 produk, stock market, IPO, akuisisi, spawn kompetitor dinamis, dan **sistem personal wealth & achievement** sebagai dual win condition.

Rubah besar: game tidak lagi cuma "survive & grow". Ada **tujuan personal**: apakah kamu mau jadi #1 di leaderboard, atau mengakumulasi kekayaan pribadi sampai miliaran? Kepemilikan saham perusahaanmu sendiri menentukan seberapa banyak kamu bisa menarik uang — jadi funding/IPO bukan gratis, ada konsekuensi ownership.

---

## 1. Ringkasan Konsep

Player tidak lagi berjalan sendirian. Ada **leaderboard 1000 produk** (rank #1 - #1000) berisi campuran:
- Produk milik player
- Kompetitor AI lama (existing, tumbuh mandiri)
- Kompetitor AI baru (muncul dinamis seiring waktu)

Semua produk bisa **IPO**, diperjualbelikan sahamnya, saling akuisisi, dan saling bersaing merebut market share. Player bisa investasi ke kompetitor, kompetitor bisa investasi balik ke player — termasuk **hostile takeover** kalau performa player melemah.

---

## 2. Roadmap Bertahap

| Versi | Fokus | Status |
|---|---|---|
| v1.9 — Competition Era | Competitor AI dasar + Marketing & Branding System | ✅ Done (Fase A) |
| v2.0 — Depth Update | R&D / Tech Tree + Investor Relations diperdalam | ✅ Done (Fase B) |
| **v2.0.5 — Wealth & Legacy** | **Personal withdrawal, achievement/title system, dual win condition** | ✅ Done |
| **v2.1 — Market Update** | **Leaderboard 1000 produk + Stock Market + IPO + Akuisisi** (fokus dokumen ini) | ✅ Done (Fase C) |
| v2.2 — Scale Update | Multi-Product Portfolio + Global Expansion | 📝 Planned |
| v2.3 — Endgame | Win conditions finalization + prestige/new game+ | 📝 Planned |

> Urutan ini dipilih karena Stock Market System butuh fondasi Competitor AI (v1.9) sudah berjalan lebih dulu — nggak ada gunanya bikin bursa saham kalau kompetitornya belum hidup.

---

## 3. Leaderboard Product (Rank #1 - #1000)

### 3.1 Komposisi Slot
- 1000 slot ranking, diisi: produk player + kompetitor AI existing + kompetitor AI baru (spawn dinamis)
- Ranking dihitung ulang tiap periode (misal tiap akhir bulan in-game) berdasarkan **Valuation Score**

### 3.2 Formula Valuasi (draft)
```
Valuation = (MonthlyRevenue × 12 × RevenueMultiple)
          + (currentUsers × UserValueFactor)
          × cohesionScore
          × growthMomentum
```
- `RevenueMultiple` & `UserValueFactor` di-tune per kategori produk (Social Media / E-Commerce / Search Engine bisa beda multiplier, mirip real-world SaaS vs marketplace valuation)
- `growthMomentum` = rasio pertumbuhan users 3 bulan terakhir (reward produk yang lagi naik, bukan cuma yang besar)

### 3.3 Simulasi Produk AI (Lightweight)
Supaya nggak berat secara performa, produk AI **tidak** disimulasikan tick-by-tick penuh seperti player. Alih-alih:
- Tiap produk AI punya beberapa parameter dasar: `growthRate`, `volatility`, `sector` (Social Media/E-Commerce/Search Engine), `personality` (lihat §5.2)
- Tiap periode (misal per bulan), valuasi & user growth dihitung pakai formula stokastik:
```
newValuation = oldValuation × (1 + growthRate + randomNoise(±volatility)) × eventModifier
```
- `eventModifier` dipengaruhi event random skala market (lihat §7)

### 3.4 Delisting & Slot Recycling
- Produk AI yang valuasinya collapse terus-menerus (misal turun >70% dalam 6 bulan) → **delisted**, slot leaderboard kosong
- Slot kosong jadi kandidat spawn kompetitor baru (§7)

---

## 4. IPO & Kepemilikan Saham

### 4.1 Aturan Kepemilikan

| Entity | Batas Minimum Kepemilikan Diri | Bisa Diakuisisi 100%? |
|---|---|---|
| Produk Player | **20%** (hard floor, tidak bisa habis dalam kondisi normal) | ❌ Tidak, kecuali *distress trigger* aktif |
| Produk AI / Kompetitor | Tidak ada batas | ✅ Ya, bisa sampai 100% |

### 4.2 Distress Trigger (Kondisi Player Bisa Diakuisisi Penuh)
Player kehilangan proteksi 20% floor kalau salah satu (atau kombinasi) kondisi ini terpenuhi selama durasi tertentu:
- Cash negatif ≥ 3 bulan berturut-turut (selaras dengan aturan bankrupt existing)
- `cohesionScore` di bawah threshold kritis (misal <30%) selama ≥60 tick
- `currentUsers` churn rate tinggi berkelanjutan (declining trend ≥3 bulan)

Saat distress aktif:
- Kompetitor **sejenis kategori produk** (Social Media vs Social Media, dst) mendapat "izin" membeli saham player melewati batas 20%
- Kalau kepemilikan luar mencapai 100% → produk player **diakuisisi penuh**, kontrol pindah ke entity pengakuisisi (game over untuk produk itu / trigger new venture, tergantung desain akhir)

### 4.3 Full Acquisition (Player → Kompetitor)
- Player bisa beli saham produk AI sampai 100% → produk itu resmi masuk portfolio player
- Produk yang diakuisisi penuh bisa:
  - Dikelola langsung (opsional, kalau ingin depth lebih), atau
  - Jadi **passive income stream** (revenue otomatis masuk cash player tiap bulan, tanpa perlu dikelola tick-by-tick)

---

## 5. Cross-Investment System

### 5.1 Player → Kompetitor
- UI baru: **Stock Market Panel** — daftar produk AI di leaderboard, harga saham, % kepemilikan tersedia, tombol Buy/Sell
- Player alokasikan cash untuk beli saham (partial atau menuju full acquisition)
- Return: dividend berkala (persentase dari revenue produk yang diinvestasikan, proporsional ke % kepemilikan) atau capital gain kalau valuasi produk itu naik dan sahamnya dijual lagi

### 5.2 Kompetitor → Player (AI Investment Logic)
Tiap kompetitor AI punya **personality** yang menentukan perilaku investasi:

| Personality | Perilaku |
|---|---|
| Aggressive | Prioritas incar produk dengan distress trigger aktif, all-in buyback |
| Conservative | Hanya investasi ke produk stabil/growing, menghindari produk volatile |
| Opportunistic | Random weighted by undervaluation (valuasi rendah tapi user growth tinggi) |

- AI investment ke player hanya bisa melewati batas 20% floor **kalau distress trigger aktif** (§4.2)
- Di luar distress, AI tetap bisa beli saham player sampai maksimal 80% (20% sisanya locked ke player)

---

## 6. Takeover Proceeds → Modal Venture Baru

- Kalau saham player di-takeover (baik partial maupun full), dana hasil penjualan **otomatis masuk sebagai capital injection**
- Capital ini di-earmark khusus untuk membuka **produk baru** (venture baru dari 0), bukan masuk cash flow biasa — supaya takeover terasa sebagai "pivot opportunity", bukan cuma kekalahan telak
- UI: notifikasi khusus "Takeover Capital Available: $X — gunakan untuk luncurkan produk baru"

---

## 7. Dynamic Competitor Spawn

### 7.1 Spawn Trigger
- Tiap interval waktu tertentu (misal tiap bulan in-game), sistem roll chance spawn kompetitor baru
- Chance dipengaruhi kondisi market:
  - Kategori produk yang "hot" (rata-rata growth tinggi di kategori itu) → spawn rate kompetitor kategori tsb naik (market gold rush effect)
  - Slot leaderboard kosong (hasil delisting) → prioritas diisi kompetitor baru

### 7.2 Karakteristik Kompetitor Baru
- Spawn dengan valuasi rendah (entry-level), growth rate & personality di-random
- Beberapa spawn dengan trait khusus ("Unicorn Candidate" — growth rate tinggi tapi volatility juga tinggi) untuk variasi dramatis di leaderboard

---

## 8. UI/UX Baru yang Dibutuhkan

| Komponen | Fungsi |
|---|---|
| `LeaderboardPanel.tsx` | Tampilkan ranking 1-1000, default: top 20 + posisi player + beberapa neighbor rank (bukan full scroll 1000 sekaligus, demi performa & UX) |
| `StockMarketPanel.tsx` | Buy/sell saham produk AI, riwayat harga (mini chart), dividend tracker |
| `AcquisitionAlert.tsx` | Notifikasi saat distress trigger aktif / saat player mulai diakuisisi kompetitor |
| `PortfolioPanel.tsx` | Daftar produk yang sudah diakuisisi/diinvestasi player, passive income summary |
| `TakeoverCapitalBanner.tsx` | Notifikasi capital baru hasil takeover, CTA "Buat Produk Baru" |
| `WealthPanel.tsx` | Personal withdrawal slider, current personal cash, ownership %, achievement progress |
| `AchievementBadge.tsx` | Badge/title display di main menu & HUD |
| `MainMenu.tsx` | (Update) Tambah section achievements — daftar title yang sudah di-unlock |

---

## 9. Data Model (Draft TypeScript)

```ts
interface MarketProduct {
  id: string;
  name: string;
  sector: 'social_media' | 'ecommerce' | 'search_engine';
  isPlayerOwned: boolean;
  valuation: number;
  sharePrice: number;
  totalShares: number;          // total 100% dipecah jadi unit saham
  ownership: OwnershipStake[];  // siapa aja pemegang saham & persentasenya
  growthRate: number;
  volatility: number;
  personality?: 'aggressive' | 'conservative' | 'opportunistic'; // hanya utk AI
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
  proceeds: number;       // masuk ke capital pool kalau player yang di-takeover
  timestamp: number;      // tick
}
```

---

## 10. Personal Wealth & Achievement System (NEW — v2.0.5)

Sistem yang memberi pemain tujuan personal di luar pertumbuhan perusahaan. Pemain bisa **menarik sebagian uang perusahaan** ke rekening pribadi, dan akumulasi uang pribadi ini membuka **achievement/title**.

### 10.1 Personal Withdrawal Mechanic

- UI baru: **Wealth Panel** — slider/tombol untuk menarik cash dari perusahaan ke `personalCash`
- Penarikan **dibatasi oleh ownership %** pemain:
  ```
  maxWithdrawal = companyCash × (playerOwnership / 100)
  ```
  - Contoh: pemilik 80% → bisa tarik max 80% dari cash perusahaan
  - Pemilik 40% → max 40% (sisa milik investor/kompetitor)
- Tidak ada batasan frekuensi — pemain bisa tarik kapan saja selama ada cash
- Penarikan **bukan pajak** — tidak ada penalti langsung, tapi company cash berkurang (risiko bankrupt)
- Tujuan: memberi konsekuensi nyata pada equity — funding/IPO bukan cuma "dapat uang gratis"

### 10.2 Achievement / Title System

Title di-unlock saat `personalCash` mencapai milestone tertentu:

| Title | Personal Cash Required | Label |
|---|---|---|
| Hustler | $100.000 | 💼 |
| Founder | $500.000 | 🏗️ |
| Tycoon | $1.000.000 | 💰 |
| Mogul | $5.000.000 | 👑 |
| Millionaire | $10.000.000 | 💎 |
| Multi-Millionaire | $100.000.000 | 🔷 |
| Billionaire | $1.000.000.000 | 🌟 |

- Title terlihat di **Main Menu** (daftar achievement yang sudah di-unlock)
- Title juga muncul di **HUD** saat bermain (sebagai label, misal "💼 Hustler")
- Untuk saat ini: **tidak ada efek gameplay langsung** — murni prestise & replayability
- Ke depannya: bisa dikaitkan dengan unlockable content (misal title tertentu buka starter perk)

### 10.3 Dual Win Condition

Game memiliki **2 cara "menang"** (tidak eksklusif — bisa kejar keduanya):

1. **Leaderboard Champion** — produk player mencapai rank #1 dan bertahan ≥3 bulan
2. **Self-Made Billionaire** — `personalCash` mencapai $1.000.000.000 (Billionaire title)

Saat salah satu tercapai:
- **Victory screen** muncul — statistik game (month bertahan, total funding, dll)
- Opsi **New Game+** — restart dengan 1 title terpilih sebagai bonus starter
- Tidak wajib berhenti — pemain bisa lanjut main (sandbox mode)

### 10.4 Hubungan dengan Funding & IPO

```
[saham 100% milik player]
    ↓ (accept funding → -equity%)
[saham player turun, investor punya %]
    ↓
[player punya 60% → hanya bisa tarik 60% dari company cash]
    ↓
[IPO di masa depan → equity semakin terdilusi]
    ↓
[player cuma punya 20% (floor) → tarikan terbatas]
```

Ini menciptakan **trade-off alami**:

| Keputusan | Dampak |
|---|---|
| Accept funding besar | Cash perusahaan naik ✅, ownership turun → withdrawal turun ❌ |
| Tolak funding | Ownership tetap tinggi ✅, tapi growth lebih lambat ❌ |
| Tarik uang sekarang | Personal cash naik ✅, company cash turun → risiko bankrupt ❌ |
| Biarkan uang di perusahaan | Aman ✅, tapi personal wealth nggak naik ❌ |

### 10.5 Data Model (Draft)

```ts
interface PlayerWealth {
  personalCash: number;           // uang pribadi yang sudah ditarik
  lifetimeWithdrawn: number;      // total sepanjang game (untuk achievement)
  unlockedTitles: TitleId[];      // title yang sudah di-unlock
}

type TitleId = 'hustler' | 'founder' | 'tycoon' | 'mogul' | 'millionaire' | 'multi_millionaire' | 'billionaire';

interface AchievementDef {
  id: TitleId;
  label: string;
  icon: string;
  requirement: number;            // personalCash threshold
}
```

---

## 11. Keputusan Desain yang Masih Perlu Diputuskan

Sebelum masuk implementasi, beberapa hal berikut perlu difinalisasi:

1. **Threshold distress trigger** — angka pasti (durasi cash negatif, threshold cohesion, dll) perlu di-balance lewat playtesting.
2. **Depth manajemen produk hasil akuisisi** — apakah player bisa masuk & kelola tick-by-tick, atau murni passive income saja?
3. **Skala leaderboard UI** — apakah perlu search/filter by sector, atau cukup top N + posisi player?
4. **Frekuensi update valuasi AI** — per bulan (600 tick) cukup, atau perlu lebih granular untuk kesan "hidup"?
5. **Game over condition** — kalau produk player (satu-satunya) diakuisisi penuh, apakah itu game over total, atau player lanjut dengan takeover capital ke venture baru?
6. **Personal withdrawal tax/fee?** — apa perlu ada penalti % setiap tarik uang? Atau gratis?
7. **Title effect?** — apakah title cuma prestise visual, atau perlu efek gameplay ringan (misal "Hustler" → starting cash +10%)?
8. **New Game+ bonus?** — restart dengan title tertentu: apa bonusnya? Perlu didesain.

---

## 12. Tahapan Pengerjaan (Build → Playtest → Balance)

Prinsip pengerjaan: **iteratif per fase**, bukan numpuk semua fitur baru balancing di akhir. Tiap fase harus melewati 3 tahap sebelum lanjut ke fase berikutnya.

### Fase A — v1.9 "Competition Era" (Fondasi) ✅ Done
1. **Build** ✅
   - ✅ Data model dasar `CompetitorProduct` (tanpa saham dulu, cuma growth mandiri)
   - ✅ Simulasi ringan: growth rate + noise per bulan
   - ✅ Marketing & Branding System (campaign, brand reputation meter)
2. **Playtest metric yang dicek** ✅
   - ✅ Kompetitor tumbuh wajar (stabil, tidak liar)
   - ✅ Marketing campaign worth cost
3. **Balancing pass** ✅
   - ✅ Tuning `growthRate` & `volatility` kompetitor
   - ✅ Tuning cost/effect campaign

### Fase B — v2.0 "Depth Update" ✅ Done
1. **Build** ✅
   - ✅ R&D / Tech Tree (12 nodes, 4 tiers, 4 levels per node, partial effects per level)
   - ✅ Investor Relations diperdalam (board target quarterly, term sheet)
   - ✅ Funding pindah ke panel Investor Relations
   - ✅ Research effects wiring ke traffic, revenue, churn, brand, server
2. **Playtest metric** ✅
   - ✅ Tech tree balance (level-based scaling: baseTicks × (1 + (level-1) × 0.5))
   - ✅ Board targets & term sheet muncul periodik
3. **Balancing pass** — TBD playtesting
   - Tuning baseTicks per tier, cost/waktu riset
   - Tuning threshold target investor & board satisfaction

### Fase B.5 — v2.0.5 "Wealth & Legacy" ✅ Done
1. **Build** ✅
   - ✅ Types & data: `PlayerWealth`, `AchievementDef`, title definitions (7 titles)
   - ✅ State: `personalCash`, `lifetimeWithdrawn`, `unlockedTitles`, `victoryAchieved` di gameStore
   - ✅ System: `calcMaxWithdrawal(companyCash, playerOwnership)`, `checkAchievements(personalCash)`
   - ✅ Action: `withdrawPersonal(amount)` — validasi ownership (20% floor), kurangi company cash, tambah personal
   - ✅ Action: `checkAchievements` — otomatis tiap withdrawal
   - ✅ UI: `WealthPanel.tsx` — slider withdrawal, personal cash display, achievement progress, title display
   - ✅ UI: `MainMenu.tsx` — (update) tambah section achievements daftar title
   - ✅ UI: `HudBar.tsx` — (update) tampilkan personal cash & current title icon
   - ✅ UI: `Dock.tsx` — (update) tambah tombol Wealth
   - ✅ Save/Load: Dexie v17 — persist semua state baru
   - ✅ Board satisfaction consequences: <40% → forced term sheet, <20% → hostile takeover warning
   - ✅ Equity consequences: >50% → board control warning
2. **Playtest metric** ✅
   - ✅ Trade-off funding vs withdrawal terasa (ownership % batasi withdrawal)
   - ✅ Achievement 7 tier dari $100K sampai $1B
3. **Balancing pass** — TBD playtesting
   - Tuning achievement thresholds (§10.2)
   - Tuning withdrawal vs company cash balance

### Fase C — v2.1 "Market Update" ✅ Done
1. **Build — urutan sub-tahap penting karena saling bergantung:**
   - ✅ a) Leaderboard 1000 produk (ranking + top20 + player neighbor + Show All toggle)
   - ✅ b) Formula valuasi (RevenueMultiple, UserValueFactor, growthMomentum) + delisting/spawn unicorn
   - ✅ c) Stock Market Panel — buy/sell saham AI competitors
   - ✅ d) Ownership & dividend system — monthly dividend payout
   - ✅ e) Distress trigger + AI investment logic (3 personality: aggressive/conservative/opportunistic)
   - ✅ f) Full acquisition logic (100% ownership → game over + takeover capital pool)
2. **Playtest metric yang dicek**
   - Apakah ranking leaderboard terasa "hidup" (posisi berubah masuk akal, nggak random liar)?
   - Apakah distress trigger ke-trigger di waktu yang wajar (nggak terlalu gampang/susah)?
   - Apakah AI investment behavior masuk akal per personality (aggressive vs conservative kerasa beda)?
   - Apakah takeover capital cukup buat mulai venture baru (nggak terlalu kecil/besar)?
3. **Balancing pass**
   - Tuning formula valuasi (§3.2), threshold distress (§4.2), spawn rate kompetitor (§7.1)
   - **Ini fase paling kompleks — sisihkan waktu balancing paling lama di sini**

### Fase D — v2.2 "Scale Update"
1. **Build**
   - Multi-Product Portfolio (state per-produk terpisah, shared resource pool)
   - Global Expansion (region baru, compliance ala GDPR)
2. **Playtest metric**
   - Apakah manage 2+ produk sekaligus terasa manageable atau overwhelming?
   - Apakah expansion region worth cost compliance tambahan?
3. **Balancing pass**
   - Tuning shared resource constraint, cost/benefit tiap region

### Fase E — v2.3 "Endgame" (Updated)
1. **Build**
   - Win condition finalization: mekanisme check rank #1 bertahan + personal wealth target
   - Victory screen (statistik, title yang di-unlock, waktu tempuh)
   - New Game+ implementation (restart dengan selected title → bonus starter)
   - Prestige system (opsional — total lifetime wealth across all playthroughs)
2. **Playtest metric**
   - Apakah endgame terasa sebagai payoff yang memuaskan?
   - Apakah New Game+ cukup menarik untuk replay?
3. **Balancing pass**
   - Tuning requirement win condition (berapa bulan rank #1 bertahan? wealth threshold?)
   - **Di sinilah waktu yang tepat untuk investasi asset/visual premium** (lihat diskusi UI prototype vs final di bawah)

### Catatan Tambahan: Prototype vs Rebuild UI
- Semua fase A-E dikerjakan dulu di atas **UI prototype seadanya** (web UI fungsional, minim styling) untuk memvalidasi gameplay & balance secepat mungkin
- Rebuild ke UI/asset final (ala Startup Company) dilakukan **setelah core loop terbukti solid** — idealnya per-modul yang sudah stabil duluan, bukan big-bang di akhir semua fase
- Prasyarat rebuild: pastikan `systems/` & `store/` tetap murni logic (tidak bocor concern ke component), supaya migrasi UI tidak perlu menyentuh ulang logic

---

## 13. Dependency Check

Fitur ini idealnya dibangun **setelah**:
- ✅ Competitor AI dasar (v1.9) — supaya ada entity untuk diperdagangkan
- ✅ Funding/Investor system existing (sudah ada di v1.3.2, bisa di-extend untuk stock market logic)

Dan **sebelum**:
- IPO player sebagai endgame win condition (v2.3) — karena valuasi & mekanisme saham harus matang dulu

---

---

*Dokumen ini adalah working spec, bisa berubah seiring diskusi & playtesting lebih lanjut.*