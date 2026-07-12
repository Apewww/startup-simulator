# Upcoming Feature v3 — Ad Sales Pipeline, Pricing, Banking & Revenue Visualization

Status: 📝 Proposed (belum diimplementasi)
Terkait: `types/employee.ts`, `data/products.ts`, `store/gameStore.ts`, `systems/monetization.ts`, `components/`, `data/perks.ts`

---

## 0. Latar Belakang

Saat ini pendapatan dari service yang dibangun pemain (Social Media / E-Commerce / Search Engine) murni pasif — formula matematis yang jalan sendiri setelah fitur terbangun. Pemain tidak punya **agency** untuk memengaruhi pendapatan secara aktif, terutama di early game (0–5.000 users) di mana revenue hampir nol.

Dokumen ini merancang 3 fase pengembangan yang memberi pemain kontrol aktif atas revenue stream:

1. **V1.6 — Ad Sales Pipeline**: Role baru Ad Monetization Specialist yang mencari client luar untuk pasang iklan. Active sales dengan negosiasi, deadline, dan reward.
2. **V1.7 — Pricing Controls & Banking**: Slider pricing per produk + sistem pinjaman bank.
3. **V1.8 — Revenue Visualization**: Deal notifications, revenue breakdown, client history.

Prinsip desain (konsisten dengan v2):
- **Aktif, bukan pasif.** Setiap revenue stream butuh keputusan pemain, bukan cuma "tunggu kaya".
- **Trade-off nyata.** Setiap keputasan (ambil contract, naikkan harga, pinjam uang) punya konsekuensi.
- **Terikat sistem existing.** Tidak ada sistem paralel baru — sales terikat ke ad_platform level, data compliance, userMood, perk points.

---

## V1.6 — Ad Sales Pipeline

### 1.1 Role: Ad Monetization Specialist

#### 1.1.1 Definisi Role

| Atribut | Nilai |
|---|---|
| `role` | `'Ad_Monetization_Specialist'` (nilai baru di `EmployeeRole`) |
| Unlock rekrut | `currentUsers >= 5.000` **dan** fitur `ad_platform` Lv. >= 3 |
| Fungsi | Mencari client luar yang mau pasang iklan di platform pemain |
| Atribut standar | Level 1–10, speed, happiness, salary (seperti karyawan lain) |
| `currentTask` | `'searching_leads'` / `'negotiating'` / `null` (idle) |

#### 1.1.2 Effect Level

| Level | Search Duration | Negosiasi Duration | Timer Lead (hari) | Match % Bonus |
|---|---|---|---|---|
| 1 | 50 tick | 30 tick | 3–7 | 0% |
| 3 | 42 tick | 25 tick | 4–10 | +3% |
| 5 | 35 tick | 20 tick | 5–12 | +5% |
| 8 | 28 tick | 16 tick | 6–14 | +8% |
| 10 | 24 tick | 12 tick | 7–14 | +10% |

#### 1.1.3 Mood & Resign

Sama seperti karyawan lain, tapi dengan aturan tambahan:
- **Idle penalty:** Jika `currentTask === null` selama > 30 tick berturut-turut, happiness decay jadi `-1.5/tick` (naik dari normal `-1/tick`).
- **Gagal negosiasi 3x berturut** setelah berhasil search → happiness langsung `-10` (frustrasi).
- Threshold resign: happiness < 15 selama 10 tick → 20% chance resign per tick (sama).

### 1.2 Lead Generation

#### 1.2.1 Client Name Pool

Array statis ~20 nama perusahaan fiktif (`src/data/clientNames.ts`):
```
PixelWorks Interactive, Aruna Digital, Bumi Cahaya Teknologi,
Karya Anak Bangsa, Nusantara Digital Kreatif, Safira Media Group,
Cakrawala Data Solusi, Gading Teknologi Nusantara, Harmoni Digital,
Indo Cloud Solutions, Jalinan Media Kreasi, Lintas Data Asia,
Matahari Digital Agency, Nusantara E-Commerce Solusi,
Orient Teknologi Global, Pilar Data Utama, Quantum Media Works,
Raja Digital Indonesia, Solusi Data Cerdas, Teknologi Mandiri Group
```

#### 1.2.2 Action: [Find Advertisers]

Klik manual di panel Ad Sales (konsisten dengan prinsip "pemain harus aktif").
- Durasi: 24–50 tick (dipengaruhi level specialist, lihat tabel §1.1.2).
- Selama mencari: specialist `currentTask = 'searching_leads'`, happiness decay normal.
- Hasil: 1–3 leads (bergantung user tier, lihat §1.2.3).
- Cooldown: setelah search selesai, pemain proses leads satu per satu. Specialist idle.

#### 1.2.3 Leads per User Tier

| Users | Tier | Leads per Search | Budget Range |
|---|---|---|---|
| 5k–20k | Small | 1–2 | $500–$2k |
| 20k–100k | Medium | 2–3 | $2k–$10k |
| > 100k | Enterprise | 2–4 | $10k–$50k |

#### 1.2.4 Lead Data Structure

```ts
export interface AdLead {
  id: string;
  clientName: string;
  budget: number;            // base price dalam dollar
  matchPercent: number;      // 20–95% — seberapa cocok client dgn platform
  expiresAt: number;         // tick deadline (global tick saat ini + random day)
  status: 'pending' | 'negotiating' | 'won' | 'lost' | 'expired';
  specialistId: string;      // specialist yang menemukan lead ini
}
```

`matchPercent` dipengaruhi:
- **Data compliance ratio:** Jika `dataRatio >= 1`, bonus `(dataRatio - 1) × 20` (max +10%).
- **userMood:** Jika `userMood < 60`, penalti -10% (client lihat platform toxic).
- **Synergy aktif** (targeted_ads route): bonus +10%.

Formula:
```
matchPercent = random(20, 70)
  + (dataRatio >= 1 ? Math.min((dataRatio - 1) * 20, 10) : 0)
  + (userMood >= 60 ? 0 : -10)
  + (synergyActive ? 10 : 0)
matchPercent = clamp(matchPercent, 20, 95)
```

#### 1.2.5 Lead Timer & Expiry

Tanggal kedaluwarsa dalam *hari in-game* (24 tick = 1 hari).

```
expiresInDays = random(1, 7) + floor(levelBonus)
levelBonus:
  Lv.1–3  → 0
  Lv.4–6  → +1
  Lv.7–9  → +2
  Lv.10   → +3
```

Hasil akhir: `expiresAt = currentTick + expiresInDays × 24`.

Lead yang tidak direspons (`status === 'pending'`) saat `tick >= expiresAt` → auto `'expired'`. Hilang permanen.

### 1.3 Negosiasi

#### 1.3.1 Action: [Negotiate]

Klik per lead di panel.
- Durasi: 12–30 tick (dipengaruhi level specialist, lihat §1.1.2).
- Selama negosiasi: `currentTask = 'negotiating'`, happiness decay normal.
- Hasil: **BERHASIL** atau **GAGAL** (dicek saat negosiasi selesai).

#### 1.3.2 Success Chance

```
baseChance = matchPercent × 0.7 + specialist.level × 2 + 5
finalChance = clamp(baseChance, 10, 90)   // dalam persen
```

- matchPercent tinggi → chance tinggi.
- Level specialist tinggi → chance tinggi.
- Minimal 10%, maksimal 90% (selalu ada risk/gap).

Roll random `0–100` saat negosiasi selesai. Jika `roll < finalChance` → **WON**.

#### 1.3.3 Deal Value (Pricing terikat ad_platform)

```
adPlatformMult = 1 + (adPlatformLevel × 0.2)
dealValue = Math.round(budget × adPlatformMult)
```

| ad_platform Lv. | Multiplier | Contoh: Budget $2k → Deal |
|---|---|---|
| 1 | ×1.2 | $2,400 |
| 3 | ×1.6 | $3,200 |
| 5 | ×2.0 | $4,000 |
| 8 | ×2.6 | $5,200 |
| 10 | ×3.0 | $6,000 |

#### 1.3.4 Campaign Duration

Setelah deal WON, lead jadi **Ad Campaign** dengan durasi random:

```ts
campaignDuration = random(30, 90)  // hari in-game
```

Revenue dibayar **per tick** selama campaign:
```
revenuePerTick = Math.round(dealValue / (campaignDuration × 24))
```

### 1.4 Ad Campaign Lifecycle

#### 1.4.1 Data Structure

```ts
export interface AdCampaign {
  id: string;
  leadId: string;
  clientName: string;
  dealValue: number;
  revenuePerTick: number;
  totalTicks: number;        // campaignDuration × 24
  ticksElapsed: number;
  status: 'active' | 'completed' | 'cancelled';
  specialistId: string;
}
```

#### 1.4.2 Tick Hook

Di `incrementTick`:
```
campaign.ticksElapsed += 1
if campaign.ticksElapsed >= campaign.totalTicks:
    campaign.status = 'completed'
```

Revenue per tick ditambahkan ke cash di bulanan billing (sama seperti ads revenue lama — digabung).

#### 1.4.3 Specialist After Campaign

- Saat campaign aktif: specialist **idle** (tidak otomatis cari leads baru).
- Pemain harus klik [Find Advertisers] lagi setelah campaign selesai (kecuali punya perk auto-renew, lihat §1.5).
- Specialist idle > 30 tick → mood penalty (lihat §1.1.3).

### 1.5 Auto-Renew Perk

#### 1.5.1 Perk Def Baru

`src/data/perks.ts` — tambah:

```ts
{
  id: 'sales_auto_renew',
  name: 'Auto-Renew Campaigns',
  description: 'Ad Monetization Specialist automatically renegotiates with past clients after campaign ends. Renewal at 70-90% of original deal value.',
  icon: 'RefreshCw',
  cost: 2,
}
```

#### 1.5.2 Mekanik

Saat campaign `completed` (atau `ticksElapsed >= totalTicks`):
- Jika specialist masih aktif (belum resign) **dan** perk `sales_auto_renew` ter-unlock:
  - Specialist otomatis mulai negosiasi ulang **tanpa klik [Find Advertisers]**.
  - Durasi negosiasi renewal: setengah durasi normal (`searchDuration` tidak diperlukan — client sudah kenal).
  - Deal value renewal: `Math.round(originalDealValue × random(0.70, 0.90))`.
  - Match % renewal: `originalMatch - 10` per renewal (client fatigue, minimal 20%).
  - Auto-renew tetap bisa gagal (chance sama seperti negosiasi biasa).
- Jika auto-renew gagal 2x berturut → client hilang permanen. Specialist idle.

#### 1.5.3 Renewal Cap

Maksimal 5 renewal per client. Setelah itu client "burn out" — tidak bisa di-renew lagi untuk client yang sama.

### 1.6 State Baru di Store

```ts
interface GameState {
  // ... existing
  adLeads: AdLead[];
  adCampaigns: AdCampaign[];
}

// Actions
searchLeads(specialistId: string): void;
negotiateLead(leadId: string): void;
cancelLead(leadId: string): void;
```

- `searchLeads`: set specialist task, generate leads setelah durasi.
- `negotiateLead`: set specialist task, roll success setelah durasi.
- Di `incrementTick`:
  - Update timer lead → expired.
  - Update campaign progress → completed → auto-renew check.
  - Mood decay specialist (idle > 30 tick → extra decay).

### 1.7 UI — Panel Ad Sales

#### 1.7.1 Tab Baru

Di panel yang sama dengan Monetization Strategy (atau tab terpisah): **"Ad Sales"**.

**Section 1 — Specialist Status:**
- Nama, level, happiness, current task (idle / searching / negotiating)
- Jika idle: tombol [Find Advertisers] (disable jika tidak ada specialist aktif)

**Section 2 — Active Leads:**
- List kartu per lead:
  ```
  ┌──────────────────────────────────────────┐
  │  PixelWorks Interactive                  │
  │  Budget: $3,000  |  Match: 78%           │
  │  ⏳ Expires: 4 hari (96 tick)            │
  │  [Negotiate] [Skip]                      │
  └──────────────────────────────────────────┘
  ```
- Lead expired: tampil dengan teks abu-abu + label "EXPIRED"
- Lead yang sudah di-[Skip]: hilang dari list

**Section 3 — Active Campaigns:**
```
┌──────────────────────────────────────────┐
│  Aruna Digital                            │
│  $4,200 deal × 45 days                   │
│  ████████░░░░░░░░░░ 40% (18/45 hari)     │
│  Revenue: $93/tick                        │
└──────────────────────────────────────────┘
```

**Section 4 — Completed Campaigns (history):**
- List ringkas: client, deal value, total revenue, auto-renew status

### 1.8 Koneksi ke Existing Systems

| System | Efek |
|---|---|
| `ad_platform` level | Deal value multiplier + unlock gate |
| `data compliance ratio` | Match % bonus |
| `userMood` | Match % penalty jika < 60 |
| Synergy (targeted_ads) | Match % +10% jika synergy aktif |
| `perkPoints` | Auto-renew perk cost 2 points |
| Happiness/resign system | Specialist bisa resign, idle penalty khusus |

---

## V1.7 — Pricing Controls & Banking

### 2.1 Pricing Slider

#### 2.1.1 Per Produk

Setiap produk punya **dial pricing** yang bisa diatur pemain. Trade-off: harga lebih tinggi → revenue per user naik, tapi growth turun / churn naik.

**Social Media — Ad Frequency:**
| Level | Revenue Mult | User Growth Mult | Mood Target | Label |
|---|---|---|---|---|
| 0 | ×1.0 | ×1.0 | 85 | Light (non-intrusive) |
| 1 | ×1.3 | ×0.90 | 75 | Moderate |
| 2 | ×1.6 | ×0.80 | 65 | Aggressive |
| 3 | ×2.0 | ×0.65 | 50 | Saturated |

**E-Commerce — Transaction Fee:**
| Fee % | Revenue Mult | Growth Mult | Mood Target |
|---|---|---|---|
| 1% | ×1.0 | ×1.0 | 82 |
| 2% | ×1.8 | ×0.90 | 76 |
| 3% | ×2.5 | ×0.78 | 68 |
| 5% | ×3.5 | ×0.55 | 50 |

**Search Engine — API Pricing:**
| Price/1k calls | Revenue Mult | Growth Mult | Mood Target |
|---|---|---|---|
| $0.001 | ×1.0 | ×1.0 | 84 |
| $0.005 | ×2.5 | ×0.85 | 75 |
| $0.01 | ×4.0 | ×0.70 | 62 |
| $0.02 | ×6.0 | ×0.45 | 45 |

#### 2.1.2 UI

Slider horizontal di panel Monetization Strategy, di bawah strategi radio toggle.

```ts
interface PricingTier {
  id: string;
  label: string;
  revenueMult: number;
  growthMult: number;
  moodTarget: number;
}
```

```ts
activePricingTier: string; // default tier pertama
setPricingTier(tierId: string): void;
```

### 2.2 Banking — Basic Loan

#### 2.2.1 Konsep

Satu tipe loan: **Business Loan**. Pemain bisa pinjam uang kapan saja (tidak perlu unlock).

#### 2.2.2 Data Structure

```ts
export interface BusinessLoan {
  id: string;
  principal: number;           // jumlah pinjaman
  interestRate: number;        // bunga per bulan (decimal, 0.08 = 8% APR)
  monthlyPayment: number;      // principal + interest / tenor
  totalMonths: number;         // tenor (6/12/24)
  monthsPaid: number;
  status: 'active' | 'paid' | 'defaulted';
}
```

#### 2.2.3 Mekanik

```
maxLoan = max(5000, companyValuation × 0.3)
companyValuation = currentUsers × 10 + totalRevenueLastMonth × 12 × 2
tenorOptions = [6, 12, 24]  // bulan in-game
interestRate = 0.08 + (tenor === 24 ? 0.04 : tenor === 12 ? 0.02 : 0)  // 8/10/12% APR
monthlyPayment = Math.round(principal × (1 + interestRate) / tenor)
```

#### 2.2.4 Action

```
takeLoan(amount: number, tenor: number): void
  - Cek: amount <= maxLoan
  - Cek: tidak ada loan 'active' (hanya 1 loan aktif dalam satu waktu)
  - Cash += amount
  - Monthly billing bertambah monthlyPayment

payLoanEarly(): void
  - Cash -= sisaPokok + interestSisa
  - Loan status = 'paid'

restartGame → reset semua loan
```

#### 2.2.5 Default

Jika saldo negatif setelah monthly billing **dan** ada loan aktif:
- `missedPaymentTicks += 1`
- Jika `missedPaymentTicks >= 90` (3 bulan in-game) → loan `defaulted`
- `defaulted` loan: tambah creditScore penalty (lihat §2.2.6)

#### 2.2.6 Credit Score (Ringan)

```ts
creditScore: number; // 0–100, default 50
```

Naik/turun:
| Event | Delta |
|---|---|
| Bayar loan tepat waktu | +5 |
| Bayar loan awal (lunas sebelum tenor) | +10 |
| Telat bayar 1 bulan | -10 |
| Loan default | -30 |

Efek:
- Credit score < 30: `maxLoan` dikali ×0.5
- Credit score > 80: `interestRate` dikurangi 0.02 (2% diskon)

#### 2.2.7 UI Banking

Tab baru di panel Keuangan atau terpisah: **"Banking"**

```
┌─ Banking ──────────────────────────────┐
│                                        │
│  Credit Score: ●●●●○○○○○○ 45/100        │
│  Max Loan: $25,000                     │
│                                        │
│  ┌────────────────────────────────┐   │
│  │  Active Loan                   │   │
│  │  Principal: $10,000            │   │
│  │  APR: 10% | Tenor: 12 bulan    │   │
│  │  Monthly: $917 | Paid: 3/12    │   │
│  │  [Pay Early]                   │   │
│  └────────────────────────────────┘   │
│                                        │
│  [Take New Loan] → form: amount slider│
│                       + tenor radio    │
└────────────────────────────────────────┘
```

### 2.3 State Baru

```ts
interface GameState {
  // V1.6
  adLeads: AdLead[];
  adCampaigns: AdCampaign[];

  // V1.7
  activePricingTier: string;
  loan: BusinessLoan | null;
  creditScore: number;
  missedPaymentTicks: number;
}
```

---

## V1.8 — Revenue Visualization

### 3.1 Deal Closing Notification

Saat negosiasi berhasil (lead → campaign):
- Notifikasi muncul otomatis: `"Deal closed with PixelWorks Interactive: $3,200 for 60 days"`
- Gaya sama seperti notifikasi existing (`addNotification` di store, auto-dismiss 3s)
- Tambah ikon briefcase/check di notifikasi

### 3.2 Revenue Breakdown (Panel Keuangan)

Di panel keuangan yang sudah ada, tambah:

**Revenue Sources** (dalam $/bulan):
```
Ads (platform):   $1,200
Ad Campaigns:     $2,800  ← BARU dari sales pipeline
Subscription:     $950
B2B API:          $750
Total Revenue:    $5,700
```

**Cost Breakdown:**
```
Salaries:         $3,200
Server:           $1,100
Loan Payment:     $917
Total Cost:       $5,217
Net:              +$483
```

Bisa render inline (tanpa charts dulu) atau pakai format SVG kecil seperti cash flow graph existing (v1.3.1).

### 3.3 Client History

Tab "Clients" di panel Ad Sales:
- **Active clients:** daftar campaign yang sedang berjalan
- **Past clients:** daftar campaign yang sudah selesai (total revenue, auto-renew status)
- **Total revenue from campaigns:** lifetime value

### 3.4 Pricing Impact Preview

Di panel Pricing Slider, sebelum pemain commit:
- Tooltip: "Mood target: 65 | Growth: ×0.80 | Revenue: ×1.6"
- Perbandingan dengan tier saat ini (change arrow ▲/▼)
- Tidak perlu konfirmasi 2-layer — slider langsung apply (seperti speed control)

---

## 4. Ringkasan Perbandingan Produk

Setelah semua fitur di atas:

| Produk | Early Game | Mid Game | Late Game |
|---|---|---|---|
| **Social Media** | Ads flat ($2/100) + Ad Sales campaign | Ad Sales pipeline + Ad Frequency slider | Targeted Ads synergy + Enterprise campaign |
| **E-Commerce** | Ads flat + Ad Sales campaign | Payment Gateway + Transaction Fee slider | Subscription $2.50 + Fee revenue dominan |
| **Search Engine** | Ads flat + Ad Sales campaign | B2B API + API Pricing slider | B2B $1,500+ /mo + API call revenue |

Semua produk punya **Ad Sales Pipeline** sebagai baseline. Produk-spesifik ada di **Pricing Slider** (masing-masing beda dial) dan **existing monetization strategy** (dari v2).

---

## 5. Phase Task Breakdown

### V1.6 — Ad Sales Pipeline

| Task | File | Difficulty |
|---|---|---|
| Types: `AdLead`, `AdCampaign`, `EmployeeRole +'Ad_Monetization_Specialist'` | `types/employee.ts` + new `types/adSales.ts` | 🟢 |
| Data: `clientNames.ts` (20 perusahaan) | `src/data/clientNames.ts` | 🟢 |
| Data: Perk `sales_auto_renew` | `src/data/perks.ts` | 🟢 |
| Systems: Lead generation logic + match % formula | `src/systems/adSales.ts` | 🟡 |
| Systems: Negosiasi logic + campaign tick hook | `src/systems/adSales.ts` | 🟡 |
| Systems: Auto-renew perk logic | `src/systems/adSales.ts` | 🟡 |
| Store: state `adLeads`, `adCampaigns` + actions | `src/store/gameStore.ts` | 🔴 |
| Store: `incrementTick` hook (lead expiry, campaign progress, specialist idle check) | `src/store/gameStore.ts` | 🔴 |
| UI: Panel Ad Sales (leads, campaigns, history) | `src/components/AdSalesPanel.tsx` | 🟡 |
| UI: Dock button untuk panel | `src/components/Dock.tsx` | 🟢 |
| Save/load: Dexie v13 + field baru | `src/db/gameDB.ts`, `src/systems/saveLoad.ts` | 🟡 |
| Build sukses (typecheck + lint) | — | 🟢 |

### V1.7 — Pricing & Banking

| Task | File | Difficulty |
|---|---|---|
| Types: `PricingTier`, `BusinessLoan` | `types/` | 🟢 |
| Store: `activePricingTier`, `loan`, `creditScore`, `missedPaymentTicks` + actions | `src/store/gameStore.ts` | 🔴 |
| Systems: Pricing multiplier integration ke `calculateRevenue` | `src/systems/monetization.ts` | 🟡 |
| Systems: Loan logic (ambil, bayar, default, credit score) | `src/systems/banking.ts` | 🟡 |
| UI: Pricing slider per produk | `src/components/FeaturesPanel.tsx` | 🟡 |
| UI: Banking panel | `src/components/BankingPanel.tsx` | 🟡 |
| UI: Dock button Banking | `src/components/Dock.tsx` | 🟢 |
| Save/load: Dexie v14 + field baru | `src/db/gameDB.ts`, `src/systems/saveLoad.ts` | 🟡 |
| Build sukses (typecheck + lint) | — | 🟢 |

### V1.8 — Revenue Visualization

| Task | File | Difficulty |
|---|---|---|
| Notification: Deal closing notif | `src/store/gameStore.ts` (existing addNotification) | 🟢 |
| UI: Revenue breakdown di panel keuangan | `src/components/FinancePanel.tsx` | 🟡 |
| UI: Client history tab | `src/components/AdSalesPanel.tsx` | 🟡 |
| UI: Pricing impact preview tooltip | `src/components/FeaturesPanel.tsx` | 🟢 |
| Build sukses (typecheck + lint) | — | 🟢 |

---

## 6. Yang Sengaja Tidak Diadopsi

- **Multi-product expansion** — belum, terlalu kompleks untuk MVP saat ini. Fokus ke 1 produk dengan revenue stream dalam.
- **Stock market / IPO** — terlalu jauh dari scope. Loan sederhana cukup untuk financial depth.
- **Revenue sharing dengan client** — deal flat value sudah cukup, % revenue sharing bikin balancing jauh lebih rumit.
- **Ad quality score / CTR** — terlalu detail mikro. Match % cukup sebagai abstraksi.

---

## 7. Catatan Balancing

**Ad Sales Pipeline:**
- 1 specialist level 1 gaji ~$500/bulan. Butuh deal minimal $500/bulan untuk break even.
- Deal value rata-rata Small tier ($1.250) × adPlatformMult (Lv.3 = ×1.6) = $2.000 / 45 hari = ~$44/hari = $1.333/bulan. Specialist gaji $500 → margin $833/bulan. Wajar.
- Di level tinggi (ad_platform Lv.8 + specialist Lv.5+) → deal $20k+ / bulan. Scaling sesuai late game.

**Pricing:**
- Perubahan pricing multiplier langsung ke `calculateRevenue` — modifikasi kecil di fungsi existing.
- Growth penalty dikalikan ke `userDelta` formula yang sudah ada di `incrementTick`.

**Banking:**
- Loan $10k dengan tenor 12 bulan, APR 10% → $917/bulan. Sebanding dengan gaji 1–2 karyawan.
- Jadi "emergency bridge", bukan free money.
