# Upcoming Feature v2 — Product Monetization Rebalance

Status: 📝 Proposed (belum diimplementasi)
Terkait: `systems/monetization.ts`, `data/products.ts`, `store/gameStore.ts`, `components/FeaturesPanel.tsx`, `systems/compliance.ts`

---

## 0. Latar Belakang

Saat ini semua produk (Social Media, E-Commerce, Search Engine) memakai rumus monetisasi yang sama:

```
Ads Revenue    = (users / 100) × $2 × uptimePenalty
Subscription   = users × $2 (perlu Payment Gateway)
Revenue Mult   = cohesionScore × complianceRevenueMult
```

Masalahnya: hanya E-Commerce yang punya jalur `Payment Gateway`, jadi Social Media dan Search Engine cuma bisa hidup dari Ads flat $2/100 users — nggak ada progression, dan nggak ada perbedaan karakter antar produk.

Dokumen ini merevisi usulan awal (dari diskusi sebelumnya) dengan angka yang **dihitung ulang berdasarkan skala ekonomi yang sudah ada** di README (cash awal $15,000, gaji level 1 $500/bulan, 600 tick/bulan), bukan angka tebakan. Tujuannya: setiap tier monetisasi baru harus terasa proporsional dibanding biaya gaji karyawan pada titik game saat fitur itu realistis di-unlock.

Prinsip desain:
- **Linear, bukan eksponensial palsu.** Formula harus jelas dan mudah ditune, bukan "$2 → $5 → $12" tanpa rumus.
- **Setiap upgrade pendapatan punya trade-off**, nyambung ke sistem yang sudah ada (cohesion, synergy, compliance) — bukan sistem terpisah baru.
- **Penalti tidak boleh membekukan game.** Revisi dari usulan awal "growth −60%" jadi lebih moderat karena itu nyaris membunuh growth di titik biasanya subscription baru diaktifkan.

---

## 1. Ads Tier System (Social Media & Search Engine)

Menggantikan Ads Revenue flat. Terikat ke level fitur "Ad Platform" (fitur baru kategori **Business**, lihat §4).

### Formula dasar

```
adsRevenuePer100 = 2 + (adPlatformLevel - 1) × 1.5
```

| Ad Platform Lv. | Revenue/100 users/bulan | Catatan |
|---|---|---|
| 1 (default) | $2.00 | sama seperti sistem lama |
| 3 | $5.00 | |
| 5 | $8.00 | |
| 8 | $12.50 | |
| 10 | $15.50 | |

Kenapa linear: mudah ditune, dan pada level 10 (biaya training `level × 400` tick = 4000 tick ≈ 6.6 bulan in-game untuk 1 karyawan) pendapatan sudah 7.75× lipat — cukup curam tanpa jadi eksponensial yang gampang lepas kendali di late-game.

### Tier tambahan (opsional, di atas formula linear)

| Tier | Requirement | Efek |
|---|---|---|
| **Banner/Video Ads** | Ad Platform Lv. ≥5 | Aktifkan formula linear di atas Lv.5 (di bawahnya Ads tetap flat $2, supaya early-game tidak berubah). Trade-off: `churn += 0.0001/tick` flat (naik dari base `(1-cohesion)×0.0002/tick`) |
| **Targeted Ads** | Ad Platform Lv. ≥5 **dan** Synergy Pair aktif | Revenue formula di atas dikali ×1.5 selama synergy aktif. Requirement tambahan: Data compliance ratio ≥100% (kalau di bawah itu, multiplier di-cap ke ×1.0 — data user nggak bisa diproses maksimal) |

Catatan implementasi: `churn` dan `Data ratio gate` dua-duanya sudah ada di `systems/platform.ts` dan `systems/compliance.ts` — tinggal dibaca, bukan dibuat ulang.

---

## 2. B2B Search API (Search Engine eksklusif)

Fitur baru kategori **Business**, unlock di Feature Lv. ≥5. Pendapatan flat bulanan, tidak tergantung fluktuasi user harian — tapi tergantung Data compliance ratio (representasi kapasitas infrastruktur buat nge-serve enterprise client).

```
b2bMonthlyRevenue = featureLevel × $150 × min(dataComplianceRatio, 1.5)
```

| Feature Lv. | Data Ratio 100% | Data Ratio 150%+ (overprovisioned) |
|---|---|---|
| 5 | $750/mo | $1,125/mo |
| 8 | $1,200/mo | $1,800/mo |
| 10 | $1,500/mo | $2,250/mo |

Perbandingan: 1 karyawan level 1 gaji $500/bulan. Jadi di Lv.5, B2B API sanggup nutup gaji 1.5 karyawan tanpa gantung ke jumlah user — ini yang bikin Search Engine punya jaring pengaman di late-game meski growth user-nya lambat di awal.

Kalau Data ratio di bawah 100% (Partial/Critical compliance), `min(ratio, 1.5)` otomatis turunkan pendapatan proporsional — tidak perlu logic baru, tinggal reuse `complianceRevenueMult` yang sudah ada per-resource.

---

## 3. Subscription Rebalance (semua produk, gate: Payment Gateway)

Revisi dari usulan awal — potongan growth 60% terlalu ekstrem (formula growth saat ini `0.005 × cohesionScore` per tick sudah lambat; dipotong 60% nyaris membekukan game di titik biasanya orang baru attempt subscription).

```
subscriptionRevenuePerUser = $2.50/bulan   (naik dari $2)
targetUsersGrowthMultiplier = ×0.65        (turun 35%, bukan 60%)
churnRate = churnRate_base − 0.00005/tick  (subscriber lebih loyal, sedikit kurangi churn)
```

| Metrik | Sebelum | Sesudah aktifkan Subscription |
|---|---|---|
| Revenue/user/bulan | $2.00 | $2.50 |
| Growth rate | `0.005 × cohesion` | `0.00325 × cohesion` |
| Churn rate | `(1-cohesion) × 0.0002` | `(1-cohesion) × 0.0002 − 0.00005` (floor 0) |

Ini tetap trade-off nyata (growth turun) tapi nggak membuat pemain merasa "salah pencet tombol" karena efeknya proporsional, bukan mayoritas dipotong.

### Freemium (opsional, sebelum Full Subscription)

Requirement: ≥1 fitur kategori Business di Lv.3.
Efek: `5% × currentUsers` jadi "Premium Users" bayar $3/bulan, tanpa penalti growth/churn (karena sifatnya opsional, tidak menghalangi user gratis).

Ini jadi jembatan progression sebelum pemain siap ambil risiko Full Subscription.

---

## 4. E-Commerce: DB Load Penalty (bukan sistem baru, modifikasi requirement compliance)

Daripada nambah "crash chance khusus e-commerce" (sistem baru terpisah), lebih konsisten pakai mekanisme compliance yang sudah ada: **naikkan Data-point requirement** fitur Business ketika Payment Gateway aktif.

Requirement compliance saat ini (dari README):
```
Business: 0.3 Compute, 0.3 Data (per level fitur)
```

Revisi ketika Payment Gateway aktif:
```
Business (Payment Gateway aktif): 0.3 Compute, 0.45 Data (+50% Data requirement)
```

Efeknya otomatis merambat lewat sistem compliance yang sudah ada: kalau Data node nggak cukup, ratio Data turun di bawah 100% → revenue multiplier turun, dan (karena water-fill RPS + overheat sudah terikat ke beban server) beban DB yang lebih tinggi juga menaikkan overheat risk secara natural — tanpa perlu formula crash baru.

Ini juga otomatis menciptakan trade-off yang diinginkan usulan awal ("beban RPS ke DB melonjak, overheat naik") tapi tanpa membuat sistem paralel yang harus dipelihara terpisah.

---

## 5. Ringkasan Perbandingan (setelah rebalance)

| Produk | Sumber pendapatan utama | Karakteristik kurva | Infrastruktur kritis |
|---|---|---|---|
| **E-Commerce** | Payment Gateway + Subscription | Deras dari awal, requirement Data +50% saat aktif | Data (DB) & Security |
| **Social Media** | Ads Tier (linear) + Targeted Ads (synergy ×1.5) | Sedang, lonjak saat Synergy aktif & compliance Data terpenuhi | Data & Network |
| **Search Engine** | Ads Tier (linear) + B2B API (flat, terikat Data ratio) | Lambat di awal, stabil & terus naik di late-game lewat B2B flat revenue | Data & Compute |

---

## 6. Cooling System pada Server Room Grid

Ini menjawab item roadmap **"Cooling Grid Refactor"** yang masih 📝 Planned. Saat ini di README sudah ada node type `Cooling Fan`, `Industrial Fan`, `Liquid Cooling`, dan rack punya stat `Cooling` (40/80/150 untuk Basic/Advanced/Enterprise) — tapi belum ada rumus yang menyambungkan itu ke heat generation per node dan ke sistem overheat/crash yang sudah ada di `systems/server.ts`. Bagian ini merancang rumusnya secara konkret, supaya cooling jadi keputusan strategis (slot rack yang dipakai fan/liquid cooling = slot yang nggak dipakai buat server node), bukan cuma dekorasi visual.

### 6.1 Heat per Node (base, sebelum overclock)

Anchor ke budget cooling rack: Basic 40 cooling / 4 slot = 10 cooling/slot, Advanced 80/6 ≈ 13.3, Enterprise 150/8 ≈ 18.75. Heat node didesain supaya rack terisi penuh server node (tanpa cooling tambahan) akan **sedikit overheat** di tier rendah — supaya pemain terdorong pakai slot buat cooling node, bukan cuma mengejar performa.

| Node | Heat (base, Lv.1) |
|---|---|
| Web T1 | 8 |
| Web T2 | 14 |
| Web T3 | 24 |
| DB T1 | 6 |
| DB T2 | 12 |
| Cache T1 | 4 |
| Cache T2 | 8 |
| Router | 2 |
| Load Balancer | 3 |
| Firewall T1 | 3 |
| Firewall T2 | 6 |

### 6.2 Overclock Heat Scaling (nonlinear)

README sudah menyatakan "Overclock: naikkan capacity tapi heat & power naik nonlinear" — ini rumus konkretnya:

```
heat(level) = baseHeat × level^1.5
```

| Level | Multiplier | Contoh: Web T2 (base 14) |
|---|---|---|
| 1 | ×1.0 | 14 |
| 2 | ×2.83 | 39.6 |
| 3 | ×5.2 | 72.8 |
| 4 | ×8.0 | 112 |
| 5 | ×11.18 | 156.5 |

Capacity naik linear/lebih landai (sudah ada di sistem overclock sekarang), sedangkan heat naik nonlinear — jadi overclock jadi trade-off nyata: capacity per-heat makin buruk di level tinggi, bukan strictly upgrade.

### 6.3 Cooling Node (mengisi slot rack, kompetisi dengan server node)

| Node | Cooling Capacity | Harga | Upkeep/bulan | Efek tambahan |
|---|---|---|---|---|
| Cooling Fan | +15 | $50 | $0 | Hanya rack sendiri |
| Industrial Fan | +40 | $180 | $5 | +10 cooling ke rack **bersebelahan** di grid (radius seperti efek furniture di Office Grid) |
| Liquid Cooling | +90 | $500 | $30 | Hanya rack sendiri, tapi ada risiko kecil "Coolant Leak" (event baru, lihat §6.5) |

Cooling node makan 1 slot rack — sama seperti server node. Ini bikin keputusan "isi rack dengan berapa banyak server vs cooling" jadi strategis, konsisten dengan filosofi trade-off game ini (mirip keputusan Core/Business/Engagement di Feature Groups).

### 6.4 Heat Ratio & Status Rack

```
heatRatio = totalHeatGenerated(rack) / totalCoolingCapacity(rack)
```

| Heat Ratio | Status | Efek |
|---|---|---|
| < 70% | **Cool** | Normal, tidak ada indikator |
| 70–100% | **Warm** | Border kuning (warning), belum ada penalti |
| 100–130% | **Overheat** | Border merah (sudah ada di UI). Crash chance pakai formula existing: `max(1%, 5% − sysAdminLevel×0.8%)/tick` |
| > 130% | **Critical Overheat** | Crash chance ×2, dan rack capacity RPS langsung ditrottle ×0.5 sampai heatRatio turun di bawah 100% lagi (rack "ngebatasin diri sendiri" — encourage pemain segera nambah cooling, bukan cuma nunggu crash) |

### 6.5 Heat Spread Antar Rack (grid-based, di `ServerRoomView`)

Supaya grid 2D server room bukan cuma visual, rack yang bersebelahan (berbagi sisi grid) saling mempengaruhi kalau salah satunya overheat:

```
jika rackA.heatRatio > 100% dan rackB bersebelahan dengan rackA:
    rackB.effectiveHeat += rackA.heatGenerated × 0.05
```

Efek: menumpuk rack panas berdekatan tanpa spacing atau tanpa Industrial Fan/Liquid Cooling bisa memicu cascading overheat. Industrial Fan yang efeknya menyebar ke rack tetangga jadi counter alami untuk risiko ini — memberi fan itu peran ganda (bantu diri sendiri + bantu tetangga).

### 6.6 SysAdmin Tie-in

Role SysAdmin yang sudah ada ("recovery node crash lebih cepat, kurangi crash chance") ditambah efek pasif baru supaya makin relevan:

```
heatSpreadReduction = sysAdminLevel × 3%   (mengurangi efek §6.5 di seluruh plot)
overheatRecoveryTime × (1 − sysAdminLevel × 5%)
```

### 6.7 (Opsional) Coolant Leak — event kecil khusus Liquid Cooling

Konsisten dengan sistem event yang sudah ada (`systems/events.ts`), bisa ditambah event ringan:

| Event | Trigger | Efek |
|---|---|---|
| Coolant Leak | Chance kecil per tick per Liquid Cooling node aktif (misal 0.05%/tick) | Cooling node itu nonaktif sementara 20-40 tick + biaya repair $100. Mitigasi: SysAdmin level tinggi kurangi chance (mirip Firewall vs DDoS) |

Ini opsional — kalau dirasa nambah kompleksitas terlalu jauh dari scope utama, bisa di-skip dan Liquid Cooling cukup jadi "mahal tapi paling reliable" tanpa risiko tambahan.

---

## 7. Rencana Implementasi

**Monetisasi:**
1. **`data/products.ts`** — tambah fitur baru "Ad Platform Interface" (kategori Business) untuk Social Media & Search Engine; tambah fitur "B2B Search API" (kategori Business, unlock Lv.5) khusus Search Engine.
2. **`systems/monetization.ts`** — ganti rumus flat Ads dengan formula linear berbasis level Ad Platform; tambah fungsi `calculateB2BRevenue()`; update `calculateSubscriptionRevenue()` dengan multiplier growth/churn baru.
3. **`systems/compliance.ts`** — tambah kondisi: kalau `paymentGatewayActive === true`, override Data requirement Business feature dari 0.3 → 0.45.
4. **`store/gameStore.ts`** — tambah state `activeMonetization: 'none' | 'text_ads' | 'video_ads' | 'targeted_ads' | 'freemium' | 'subscription'` per produk (bukan global, karena tiap produk bisa beda strategi).
5. **`components/FeaturesPanel.tsx`** — tambah section "Monetization Strategy" dengan toggle/radio, tampilkan requirement (level, synergy, compliance) dan preview efek sebelum pemain switch.

**Cooling System:**
6. **`data/servers.ts`** — tambah field `heat` per node type (tabel §6.1), dan definisikan `Cooling Fan`, `Industrial Fan`, `Liquid Cooling` sebagai item beli dengan `coolingCapacity`, harga, upkeep (§6.3).
7. **`types/server.ts`** — tambah field `heatGenerated`, `coolingCapacity`, `heatRatio` ke `ServerRack`/`ServerNode`; tambah `adjacentRackIds` untuk keperluan heat spread grid.
8. **`systems/server.ts`** — implementasi `calculateHeatRatio()`, integrasikan overclock nonlinear (§6.2) ke heat existing, tambah state Critical Overheat (throttle ×0.5) di atas overheat yang sudah ada, dan fungsi heat spread antar rack bersebelahan (§6.5).
9. **`components/ServerRoomView.tsx` / `LandMap.tsx`** — render status warna rack 4 tingkat (Cool/Warm/Overheat/Critical), dan highlight rack tetangga yang kena efek spread saat hover.
10. **`systems/compliance.ts`** atau tempat SysAdmin logic berada — tambah `heatSpreadReduction` dan `overheatRecoveryTime` multiplier per level SysAdmin (§6.6).
11. **(Opsional) `systems/events.ts`** — tambah event "Coolant Leak" kalau §6.7 mau diadopsi.

**Testing/balancing pass (semua fitur di atas):**
12. Simulasikan tick-by-tick di 3 titik game (early: user 1k, mid: user 20k, late: user 200k) untuk masing-masing produk, cek apakah revenue-per-bulan sebanding dengan biaya operasional (gaji + server cost) di titik yang sama. Sesuaikan konstanta ($150 B2B, $1.5 slope Ads, dst.) kalau timpang.
13. Simulasikan rack full-slot server node tanpa cooling tambahan di tiap rack tier (Basic/Advanced/Enterprise) untuk validasi bahwa heat budget di §6.1 memang mendorong pemain investasi cooling node, bukan malah membuat rack tier rendah otomatis selalu overheat parah / rack tier tinggi jadi kebal overheat.

---

## 8. Yang Sengaja Tidak Diadopsi dari Usulan Awal

- **Angka eksponensial "$2 → $5 → $12" tanpa rumus** → diganti formula linear eksplisit supaya bisa ditune terukur.
- **Potongan growth 60% untuk Full Subscription** → diturunkan jadi 35% (multiplier ×0.65), karena 60% nyaris membekukan growth di titik yang biasanya baru dicoba pemain.
- **"Beban RPS ke DB melonjak" sebagai mekanik baru terpisah** → diganti jadi modifikasi requirement compliance yang sudah ada, biar tidak ada sistem paralel yang harus dipelihara dua kali.