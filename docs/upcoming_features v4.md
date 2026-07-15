# Upcoming Feature — "Market & Competition Era" (v1.9 - v2.3)

Dokumen roadmap & spec konsep untuk update besar berikutnya Startup Simulator, melanjutkan dari v1.8 (terakhir selesai). Fokus utama: mengubah "Kompetitor AI" (yang sebelumnya cuma 📝 Planned) menjadi ekosistem penuh: leaderboard 1000 produk, stock market, IPO, akuisisi, dan spawn kompetitor dinamis.

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
| v2.0 — Depth Update | R&D / Tech Tree + Investor Relations diperdalam | 📝 Planned |
| **v2.1 — Market Update** | **Leaderboard 1000 produk + Stock Market + IPO + Akuisisi** (fokus dokumen ini) | 📝 Planned |
| v2.2 — Scale Update | Multi-Product Portfolio + Global Expansion | 📝 Planned |
| v2.3 — Endgame | IPO player sebagai win condition, prestige/new game+ | 📝 Planned |

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

## 10. Keputusan Desain yang Masih Perlu Diputuskan

Sebelum masuk implementasi, beberapa hal berikut perlu difinalisasi:

1. **Threshold distress trigger** — angka pasti (durasi cash negatif, threshold cohesion, dll) perlu di-balance lewat playtesting.
2. **Depth manajemen produk hasil akuisisi** — apakah player bisa masuk & kelola tick-by-tick, atau murni passive income saja?
3. **Skala leaderboard UI** — apakah perlu search/filter by sector, atau cukup top N + posisi player?
4. **Frekuensi update valuasi AI** — per bulan (600 tick) cukup, atau perlu lebih granular untuk kesan "hidup"?
5. **Game over condition** — kalau produk player (satu-satunya) diakuisisi penuh, apakah itu game over total, atau player lanjut dengan takeover capital ke venture baru?

---

## 11. Tahapan Pengerjaan (Build → Playtest → Balance)

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

### Fase B — v2.0 "Depth Update"
1. **Build**
   - R&D / Tech Tree (unlock fitur generasi baru)
   - Investor Relations diperdalam (board target quarterly, term sheet)
2. **Playtest metric**
   - Apakah tech tree worth investasi waktu Developer dibanding upgrade fitur biasa?
   - Apakah target board realistis dicapai tanpa terlalu menekan?
3. **Balancing pass**
   - Tuning cost/waktu riset, tuning threshold target investor

### Fase C — v2.1 "Market Update" (Fokus dokumen ini)
1. **Build — urutan sub-tahap penting karena saling bergantung:**
   - a) Leaderboard 1000 produk (ranking read-only dulu, belum ada saham)
   - b) Formula valuasi + delisting/spawn logic
   - c) Stock Market Panel — beli/jual saham (player → kompetitor dulu, satu arah)
   - d) Ownership & dividend system
   - e) Distress trigger + AI investment logic (kompetitor → player, dua arah)
   - f) Full acquisition logic (100% ownership) + takeover capital pool
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

### Fase E — v2.3 "Endgame"
1. **Build**
   - IPO player sebagai win condition
   - Victory screen / prestige / new game+ (opsional)
2. **Playtest metric**
   - Apakah endgame terasa sebagai payoff yang memuaskan dari semua sistem sebelumnya?
3. **Balancing pass**
   - Tuning requirement IPO (valuasi minimum, dsb)
   - **Di sinilah waktu yang tepat untuk investasi asset/visual premium** (lihat diskusi UI prototype vs final di bawah)

### Catatan Tambahan: Prototype vs Rebuild UI
- Semua fase A-E dikerjakan dulu di atas **UI prototype seadanya** (web UI fungsional, minim styling) untuk memvalidasi gameplay & balance secepat mungkin
- Rebuild ke UI/asset final (ala Startup Company) dilakukan **setelah core loop terbukti solid** — idealnya per-modul yang sudah stabil duluan, bukan big-bang di akhir semua fase
- Prasyarat rebuild: pastikan `systems/` & `store/` tetap murni logic (tidak bocor concern ke component), supaya migrasi UI tidak perlu menyentuh ulang logic

---

## 12. Dependency Check

Fitur ini idealnya dibangun **setelah**:
- ✅ Competitor AI dasar (v1.9) — supaya ada entity untuk diperdagangkan
- ✅ Funding/Investor system existing (sudah ada di v1.3.2, bisa di-extend untuk stock market logic)

Dan **sebelum**:
- IPO player sebagai endgame win condition (v2.3) — karena valuasi & mekanisme saham harus matang dulu

---

---

*Dokumen ini adalah working spec, bisa berubah seiring diskusi & playtesting lebih lanjut.*