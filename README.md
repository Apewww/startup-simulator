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

## Struktur Project

```
src/
├── App.tsx                   # Root — routing antar screen
├── main.tsx                  # Entry point
├── index.css                 # Global CSS + dark theme vars
│
├── components/               # UI components
│   ├── MainMenu.tsx          # Halaman awal
│   ├── ProductSelect.tsx     # Pemilihan produk
│   ├── PlayerSetup.tsx       # Input username
│   ├── HudBar.tsx            # Toolbar (cash, stats, speed, compliance dot)
│   ├── Dock.tsx              # Sidebar navigasi
│   ├── MainViewport.tsx      # Area konten utama
│   ├── OfficeGrid.tsx        # Visual kantor grid 2D
│   ├── EmployeesPanel.tsx    # Panel karyawan: assign, train, vacation
│   ├── FeaturesPanel.tsx     # Panel fitur: build/upgrade, group label, synergy
│   ├── RecruitmentPanel.tsx  # Panel rekrutmen: campaign, negotiate
│   ├── ServerPanel.tsx       # Panel server: compliance bars, racks, rental
│   ├── FinancePanel.tsx      # Laporan keuangan, cash flow chart
│   ├── FundingPanel.tsx      # Funding round offers
│   ├── CashFlowChart.tsx     # Bar chart cash flow inline SVG
│   ├── FloatingPanel.tsx     # Container panel draggable
│   ├── PanelTaskbar.tsx      # Taskbar toggle panel
│   ├── EventBanner.tsx       # Banner untuk active events (DDoS, dll)
│   ├── LandMap.tsx           # Peta plot server room
│   ├── ServerRoomView.tsx    # Grid server room + rack placement
│   ├── ServerShop.tsx        # Shop beli rack, node, rental
│   ├── CharacterAvatar.tsx   # Sprite karakter
│   ├── AdSalesPanel.tsx      # Panel Ad Sales (Accept/Negotiate/Campaigns)
│   ├── StockMarketPanel.tsx  # Market saham — beli/jual, harga, dividend tracker
│   ├── PortfolioPanel.tsx    # Daftar investasi & produk akuisisi player
│   ├── AcquisitionAlert.tsx  # Notifikasi distress trigger & akuisisi berlangsung
│   ├── TakeoverCapitalBanner.tsx # Banner capital hasil takeover + CTA venture
│   └── DevPanel.tsx          # Dev mode cheat panel
│
├── store/
│   └── gameStore.ts          # Zustand — seluruh state & actions
│
├── systems/                  # Business logic
│   ├── platform.ts           # Cohesion score, synergy, event effects
│   ├── server.ts             # Water-fill RPS distribution, overheat, crash
│   ├── compliance.ts         # Point system: compute/data/network/security
│   ├── events.ts             # Random events: DDoS, traffic spike, PR crisis
│   ├── monetization.ts       # Revenue kalkulasi
│   ├── recruitment.ts        # Applicant generation, negotiation
│   ├── adSales.ts            # Lead generation, negotiation chance, campaign
│   ├── market.ts             # Market valuation, dividend, distress, takeover logic
│   └── saveLoad.ts           # Save/load IndexedDB
│
├── data/                     # Data statis
│   ├── products.ts           # 3 produk + fitur + synergy pairs
│   ├── servers.ts            # Rack tiers, node types + point values
│   └── components.ts         # Komponen software + min level
│
├── types/                    # TypeScript interfaces
│   ├── employee.ts           # Employee, Applicant, FundingRound
│   ├── feature.ts            # PlatformFeature, FeatureGroup
│   ├── event.ts              # GameEvent, EventType
│   ├── server.ts             # ServerNode, ServerRack, RentedServer, NodeDef
│   ├── resource.ts           # ComponentResource
│   ├── company.ts            # Company aggregate
│   └── index.ts              # Barrel export
│
└── db/
    └── gameDB.ts             # Dexie schema (IndexedDB, v7)
```

---

## Sistem & Logika Game

### Game Loop

Tick-based simulation via `setInterval(incrementTick, 2000 / speed)`:

- 1 tick = 1 jam in-game
- 20 tick = 1 hari, 600 tick = 1 bulan
- Speed 1x/2x/4x, bisa pause

Setiap tick:
1. Produksi komponen karyawan
2. Happiness decay + overwork check + resign check
3. Training progress
4. Dynamic user pool: `currentUsers` bergerak gradual menuju `targetUsers`
5. Platform stats: cohesion, synergy, event effects
6. Compliance check: compute/data/network ratio → user cap, revenue mult
7. Water-fill RPS distribution ke semua web server (owned + rented)
8. Overheat + crash detection
9. Event trigger + processing (DDoS, traffic spike, dll)
10. Setiap bulan: payroll, server cost, revenue, funding check

### Player Character (CEO)

- `isPlayer: true` — tidak bisa resign/dipecat
- Role dinamis: Developer / Designer / HR (dropdown di EmployeeCard)
- Bisa training dan assign task seperti karyawan lain
- Overwork penalty: happiness < 20 selama ≥50 tick → speed -30%

### Karyawan

**Roles:** Developer, Designer, Lead_Developer, SysAdmin, HR, Ad_Monetization_Specialist

| Role | Fungsi |
|---|---|
| Designer | Produksi UI Component, Graphics Component, Brand Identity |
| Developer | Produksi Backend Code, Network Module, Security Protocol |
| Lead Developer | Supervisi Developer: boost output tiap dev = `leadSpeed × 0.1` dengan soft diminishing return (dev tambahan -5%, floor 50%); cap developer scale per level |
| SysAdmin | Recovery node crash lebih cepat, kurangi crash chance |
| HR | Recruitment boost: campaign lebih cepat, applicant quality lebih tinggi |
| Ad Monetization Specialist | Mencari client luar untuk pasang iklan (leads), negosiasi deal, kelola campaign |

**Atribut:** level (1+), happiness (0-100), speed, salary, currentTask, isTraining, onVacation

**Training:** `level × 400` tick, progress bar kuning, cancel anytime (progress reset)
**Vacation:** 1-7 hari, happiness recovery +0.1/tick, progress bar hijau
**Bonus:** $200 → +20 happiness

### Feature System

3 produk: Social Media, E-Commerce, Search Engine — masing-masing 7 fitur.

**Feature Groups (v1.3.4):**
- **Core** (weight ×3) — fitur utama
- **Business** (weight ×2) — fitur monetisasi/support
- **Engagement** (weight ×1) — fitur tambahan

**Cohesion Score:** Weighted variance — core tertinggal = penalty besar. Mempengaruhi revenue multiplier & user growth.

**Synergy Pairs:** Fitur tertentu dapet bonus jika level seimbang (±2 level, min Lv.3):
- Social Media: News Feed + User Profiles → +15% traffic
- E-Commerce: Shopping Cart + Payment Gateway → +10% revenue
- Search Engine: Search Algorithm + Index Builder → +15% traffic

### Dynamic Users (v1.3.4)

`currentUsers` dipisah dari `targetUsers` (raw traffic). Gerak gradual:

```
delta = (targetUsers - currentUsers) × 0.005 × cohesionScore
crashPenalty = ada node crash → -5% currentUsers
churn = currentUsers × (1 - cohesionScore) × 0.0002
currentUsers += (delta × eventEffect) - crashPenalty - churn
```

- Naik perlahan kalau platform bagus & balanced
- Turun kalau cohesion jelek atau server crash
- Revenue & RPS pakai `currentUsers`, bukan `targetUsers`

### Server Compliance System (v1.3.4)

Hardware harus memenuhi requirement fitur. Setiap node punya point:

| Node | Compute | Data | Network | Security | Heat |
|---|---|---|---|---|---|
| Web T1 | 2 | 0 | 0 | 0 | 8 |
| Web T2 | 4 | 0 | 0 | 0 | 14 |
| Web T3 | 8 | 0 | 0 | 0 | 24 |
| Web T4 | 15 | 0 | 0 | 0 | 30 |
| DB T1 | 0 | 2 | 0 | 0 | 6 |
| DB T2 | 0 | 5 | 0 | 0 | 12 |
| DB T3 | 0 | 10 | 0 | 0 | 20 |
| Cache T1 | 0 | 0 | 2 | 0 | 4 |
| Cache T2 | 0 | 0 | 5 | 0 | 8 |
| Cache T3 | 0 | 0 | 10 | 0 | 16 |
| Load Balancer | 1 | 0 | 1 | 0 | 3 |
| Firewall T1 | 0 | 0 | 0 | 2 | 3 |
| Firewall T2 | 0 | 0 | 0 | 5 | 6 |

Feature requirements per level: Core (0.5C, 0.3D, 0.3N), Business (0.3C, 0.3D), Engagement (0.3C, 0.3N)

| Ratio | Status | Efek |
|---|---|---|
| < 50% | **Critical** | users = 0 (service mati) |
| 50-99% | **Partial** | users capped, revenue × ratio |
| ≥ 100% | **OK** | full service |

Network shortage → revenue penalty (80-100%).
Security → mengurangi DDoS chance (reroll event).

### Server Infrastructure

**Rack Tiers:**

| Tier | Slot | Base Cooling | Price | /mo |
|---|---|---|---|---|
| Basic | 4 | 40 | $200 | $20 |
| Advanced | 6 | 80 | $500 | $50 |
| Enterprise | 8 | 150 | $1,200 | $100 |

**Node Types:** Web T1-T4, DB T1-T3, Cache T1-T3, Cooling Fan, Industrial Fan, Liquid Cooling, Storage, Firewall T1-T2, Rate Limiter, Load Balancer

**Water-fill RPS Distribution (v1.3.4):**
```
1. Kumpulin semua kapasitas web (owned + rented) dalam antrian
2. Isi server pertama sampai penuh (100%), spill ke server berikutnya
3. Server terakhir dapet sisanya
```
Bukan dibagi rata — server pertama menanggung beban dulu sebelum server baru kena.

**Node Scaling (Overclock):** Level 1-5, naikkan capacity tapi heat & power naik nonlinear.

**Cooling System (v1.5.4):**
- Setiap node menghasilkan **heat**. Total heat rack vs cooling capacity → **heat ratio**.
- 4 status: Cool (<70%), Warm (70-100%), Overheat (100-130%), Critical (>130%)
- Overheat ≥5 tick → crash chance per node. Critical: crash chance ×2, capacity throttle.
- **Heat spread:** Overheated rack kirim 5% heat ke rack tetangga di grid.
- **Overheat recovery:** Saat rack dingin, node overheating pulih otomatis setelah `max(3, 12 - sysAdminLevel × 2)` tick.
- Cooling node (Fan / Industrial Fan / Liquid Cooling) tambah cooling capacity ke rack. Industrial Fan juga +10 ke rack tetangga.
- SysAdmin kurangi spread heat 3%/level dan percepat recovery.

**Rented Server Scaling:** Cloud/Dedicated/VPS bisa di-scale (Lv.1-5), naikkan capacity, points, dan biaya.

### Events System (v1.3.4)

Events random, frekuensi dipengaruhi ukuran platform & security level:

| Event | Efek |
|---|---|
| DDoS Attack | RPS × 2.5, revenue × 0.5, crash chance +15% |
| Traffic Spike | User growth +50% |
| Server Outage | 1 random rack crash |
| PR Crisis | User growth = 0 (50-100 tick) |
| Viral Growth | +10% users instan |

Mitigasi: Firewall turunkan DDoS chance, Rate Limiter pendekkan durasi DDoS.

### Monetisasi

```
Ads Revenue    = (users / 100) × $2 × uptimePenalty
Subscription   = users × $2 (perlu Payment Gateway)
Revenue Mult   = cohesionScore × complianceRevenueMult
```

### Recruitment

- Campaign: Basic / Pro / Headhunter, butuh HR lead assigned
- HR level mempengaruhi campaign speed & applicant quality
- Negosiasi gaji: applicant bisa counter / reject / accept
- Owner bisa switch ke role HR via dropdown

### Save/Load

IndexedDB via Dexie.js. Autosave tiap 60 detik. Field: tick, cash, employees, resources, features, racks, plots, rentedServers, inventoryNodes, currentUsers, events, fundingRounds, dll.

---

## UI Components

### HUD Bar
- Date/time, speed controls
- **Current Users** (dynamic, bukan target)
- **Platform Health** meter (cohesion score)
- **Compliance dot** — HW OK (hijau) / HW ⚠ (kuning) / HW ✗ (merah)
- **Event badge** — DDoS (merah animate), event lain (kuning)
- Funding offer badge
- Bankrupt warning
- Cash + profit indicator

### Server Panel
- **Compliance Bars** — Compute/Data/Network/Security with progress bars
- **Data Center (LandMap)** — list plot + racks per plot
- **Rented Servers** — load bar + scale ± buttons
- **Node Inventory** (di grid view) — click node → auto-place ke slot kosong pertama

### Features Panel
- Group label: CORE / BIZ / ENG
- Synergy badge: ⚡ Synergy
- Build/Upgrade buttons

### Office Grid
- Grid 2D kantor modular — drag & drop meja karyawan ke slot manapun
- Warna status: hijau (bekerja), biru (idle), merah (happiness rendah)

### Perks & Furniture
- Milestone kasih **Perk Point**; spend point buat unlock furniture di `PerksPanel`
- Furniture: Coffee Machine (−50% work happiness decay, band 2 baris), Ergonomic Chair (overwork threshold 50→80, per-meja), Water Dispenser (+0.15/tick idle recovery, band 2 baris)
- Beli di Furniture Shop → place di Office Grid (efek radius/band horizontal)

### Server Room Grid
- Drag & drop rack dari inventory ke grid
- Klik rack → buka slot detail + inventory panel otomatis
- Water-fill load distribution
- Overheat indicator (border merah)

### Events Banner
- Muncul di tengah bawah saat event aktif
- Progress bar durasi + nama event

---

## Data & Balancing

| Parameter | Nilai |
|---|---|---|
| Cash awal | $15,000 |
| Gaji level 1 | $500/bulan |
| Ticks/bulan | 720 (24/hari × 30 hari) |
| 1 tick = 1 jam in-game | |
| Base produksi komponen | 400-800 tick |
| Happiness decay (kerja) | -0.05/tick |
| Happiness decay (idle) | -0.005/tick |
| Bonus happiness >80 | speed × 1.3 |
| Penalty happiness <30 | speed × 0.6 |
| Overwork threshold | happiness <20 selama 50 tick → -30% speed |
| User growth rate | 0.005/tick × cohesion |
| Churn rate | (1 - cohesion) × 0.0002/tick |
| Ads revenue | $2 per 100 users/bulan |
| Subscription | $2 per user/bulan (dengan Payment Gateway) |
| Crash penalty | 50% revenue |
| Node crash chance | max(1%, 5% - sysAdminLevel × 0.8%)/tick (×2 saat Critical) |
| Overheat recovery | maks(3, 12 - sysAdminLevel × 2) tick setelah rack dingin |
| Heat spread | 5% rawHeat ke setiap rack adjacent saat heatRatio > 1.0 |
| DDoS crash bonus | +15% crash chance |
| Bangkrut | 3 bulan cash negatif |
| Sell refund | 50% harga |
| DB version | 19 |

---

## Roadmap

| Fase | Status |
|---|---|
| Fase 1 — Excel Phase | ✅ |
| Fase 2 — Server Management | ✅ |
| Fase 3 — Visual Kantor | ✅ |
| Fase 4 — Tauri & Desktop | ✅ |
| v1.3 — Balancing & Polish | ✅ |
| v1.3.1 — Cash Flow Chart | ✅ |
| v1.3.2 — SysAdmin & Funding | ✅ |
| v1.3.3 — Player Character, HR, Training | ✅ |
| v1.3.4 — Cohesion, Events, Compliance | ✅ |
| v1.4 — Lead Developer + Furniture System | ✅ |
| v1.5 — Monetization Rebalance + Cooling Grid | ✅ |
| v1.6 — Ad Sales Pipeline | ✅ |
| v1.7 — Pricing Controls & Banking | ✅ |
| v1.8 — Revenue Visualization & Polish | ✅ |
| v1.9 — Competition Era (Competitor AI + Marketing) | ✅ |
| v2.0 — Depth Update (R&D Tech Tree + Investor Relations) | ✅ |
| v2.0.5 — Wealth & Legacy (Personal Wealth + Achievements) | ✅ |
| v2.1 — Market Update (Leaderboard 1000 + Stock Market + Multi-AI Funding) | ✅ |
| v2.2 — Scale Update (Multi-Product + Global Expansion) | 📝 Planned |

---

## Update Log

| Versi | File |
|---|---|
| v1.0 | [docs/Update_V1.0.md](docs/Update_V1.0.md) |
| v1.1 | [docs/update_v1.1.md](docs/update_v1.1.md) |
| v1.1.1 | [docs/update_v1.1.1.md](docs/update_v1.1.1.md) |
| v1.1.2 | [docs/update_v1.1.2.md](docs/update_v1.1.2.md) |
| v1.1.3 | [docs/update_v1.1.3.md](docs/update_v1.1.3.md) |
| v1.1.4 | [docs/update_v1.1.4.md](docs/update_v1.1.4.md) |
| v1.2 | [docs/update_v1.2.md](docs/update_v1.2.md) |
| v1.3 | [docs/update_v1.3.md](docs/update_v1.3.md) |
| v1.3.1 | [docs/update_v1.3.1.md](docs/update_v1.3.1.md) |
| v1.3.2 | [docs/update_v1.3.2.md](docs/update_v1.3.2.md) |
| v1.3.3 | [docs/update_v1.3.3.md](docs/update_v1.3.3.md) |
| v1.3.4 | [docs/update_v1.3.4.md](docs/update_v1.3.4.md) |
| v1.4 | [docs/update_v1.4.md](docs/update_v1.4.md) |
| v1.4.1 | [docs/update_v1.4.1.md](docs/update_v1.4.1.md) |
| v1.4.2 | [docs/update_v1.4.2.md](docs/update_v1.4.2.md) |
| v1.4.3 | [docs/update_v1.4.3.md](docs/update_v1.4.3.md) |
| v1.4.4 | [docs/update_v1.4.4.md](docs/update_v1.4.4.md) |
| v1.4.5 | [docs/update_v1.4.5.md](docs/update_v1.4.5.md) |
| v1.4.6 | [docs/update_v1.4.6.md](docs/update_v1.4.6.md) |
| v1.5 | [docs/update/update_v1.5.md](docs/update/update_v1.5.md) |
| v1.5.1 | [docs/update/update_v1.5.1.md](docs/update/update_v1.5.1.md) |
| v1.5.2 | [docs/update/update_v1.5.2.md](docs/update/update_v1.5.2.md) |
| v1.5.3 | [docs/update/update_v1.5.3.md](docs/update/update_v1.5.3.md) |
| v1.5.4 | [docs/update/update_v1.5.4.md](docs/update/update_v1.5.4.md) |
| v1.6 | [docs/update/update_v1.6.md](docs/update/update_v1.6.md) |
| v1.7 | [docs/update/update_v1.7.md](docs/update/update_v1.7.md) |
| v1.8 | [docs/update/update_v1.8.md](docs/update/update_v1.8.md) |
| v1.9 | [docs/update/update_v1.9.md](docs/update/update_v1.9.md) |
| v2.0 | [docs/update/update_v2.0.md](docs/update/update_v2.0.md) |
| v2.1 | [docs/update/update_v2.1.md](docs/update/update_v2.1.md) |
