# 🚀 Startup Simulator

Game simulasi manajemen startup teknologi berbasis desktop. Dibangun dengan Tauri + React + TypeScript. Terinspirasi dari *Startup Company* (Hovgaard Games).

---

## 📋 Daftar Isi

- [Tech Stack](#tech-stack)
- [Cara Menjalankan](#cara-menjalankan)
- [Struktur Project](#struktur-project)
- [Tampilan & UI](#tampilan--ui)
- [Sistem & Logika Game](#sistem--logika-game)
- [Alur Data (Game Loop)](#alur-data-game-loop)
- [Data & Balancing](#data--balancing)
- [Roadmap](#roadmap)

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
# Install dependencies
npm install

# Jalankan dev server (browser)
npm run dev

# Jalankan sebagai aplikasi Tauri desktop
npm run tauri dev

# Build production .exe
npm run tauri build
```

---

## Struktur Project

```
src/
├── App.tsx                  # Root — routing antar screen (menu/select/playing)
├── main.tsx                 # Entry point React
├── index.css                # Global CSS + scanlines effect
│
├── components/              # Semua UI components
│   ├── MainMenu.tsx         # Halaman awal game
│   ├── ProductSelect.tsx    # Layar pemilihan produk
│   ├── HudBar.tsx           # Toolbar atas (cash, stats, speed)
│   ├── Dock.tsx             # Sidebar kiri navigasi
│   ├── MainViewport.tsx     # Area konten utama
│   ├── OfficeGrid.tsx       # Visual kantor (grid 2D karyawan)
│   ├── LandMap.tsx          # Peta plot server room
│   ├── ServerRoomView.tsx   # View server room + rack management
│   ├── EmployeesPanel.tsx   # Panel daftar karyawan
│   ├── FeaturesPanel.tsx    # Panel build/upgrade fitur produk
│   ├── ServerPanel.tsx      # Shop & panel server rental
│   ├── FinancePanel.tsx     # Laporan keuangan bulanan
│   ├── FloatingPanel.tsx    # Container panel mengambang (draggable)
│   ├── PanelTaskbar.tsx     # Taskbar bawah untuk toggle panel
│   ├── DevPanel.tsx         # Dev mode cheat panel
│   └── CharacterAvatar.tsx  # Sprite karakter karyawan
│
├── store/
│   └── gameStore.ts         # Zustand store — seluruh state & actions
│
├── systems/                 # Business logic murni
│   ├── server.ts            # Kalkulasi beban server, panas, crash
│   ├── traffic.ts           # Konversi fitur → users & RPS
│   ├── monetization.ts      # Kalkulasi pemasukan ads & subscription
│   └── saveLoad.ts          # Fungsi save/load ke IndexedDB
│
├── data/                    # Data statis game
│   ├── products.ts          # Definisi 3 produk + fitur per produk
│   ├── servers.ts           # Definisi rack tiers & node types
│   └── components.ts        # Definisi komponen software yang diproduksi
│
├── types/                   # TypeScript interfaces
│   ├── employee.ts
│   ├── server.ts
│   ├── feature.ts
│   ├── resource.ts
│   ├── company.ts
│   └── index.ts
│
└── db/
    └── gameDB.ts            # Dexie.js schema (IndexedDB)
```

---

## Tampilan & UI

### 1. Main Menu

Halaman pertama yang muncul saat game dibuka.

```
┌─────────────────────────────┐
│                             │
│      Startup Simulator      │  ← Judul dengan efek neon glow
│  Build your tech empire...  │
│                             │
│  ┌───────────────────────┐  │
│  │  New Game          ▶  │  │  ← Menuju layar pilih produk
│  └───────────────────────┘  │
│  ┌───────────────────────┐  │
│  │  Load Game         ⟳  │  │  ← Disabled jika tidak ada save
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │  Keluar            ⏻  │  │  ← Menutup window Tauri
│  └───────────────────────┘  │
│                    v1.1.4   │
└─────────────────────────────┘
```

### 2. Layar Pilih Produk (`ProductSelect`)

Pemain memilih satu dari 3 jenis produk yang akan dibangun sepanjang game. Pilihan ini **permanen** dan menentukan daftar fitur yang tersedia.

| Produk | Tagline | Fitur Utama |
|---|---|---|
| **Social Media** | Connect the world | User Profiles, News Feed, Messaging, Photo Sharing, Stories |
| **E-Commerce** | Shop smarter | Product Listing, Shopping Cart, Payment Gateway, Review System, Recommendation Engine |
| **Search Engine** | Find anything | Web Crawler, Search Algorithm, Index Builder, Image Search, Maps |

### 3. HUD Bar (Toolbar Atas)

Selalu tampil saat game berjalan. Menampilkan:

```
STARTUPSIM │ CASH $10,000 │ USERS 0 │ RPS 0 │ MONTH 0 │ DAY 1/30 │ [Pause] [1x][2x][4x] │ [Save]
```

- **CASH** — Saldo perusahaan (merah jika negatif)
- **USERS** — Total pengguna aktif platform
- **RPS** — Request Per Second yang masuk ke server
- **MONTH / DAY** — Waktu in-game
- **Speed controls** — Pause / 1x / 2x / 4x
- **Save** — Menyimpan game ke IndexedDB
- **Peringatan bangkrut** — Muncul animasi pulse jika cash negatif

### 4. Dock (Sidebar Kiri)

Navigasi utama dengan ikon untuk berpindah view:
- 🏢 **Office** — Grid kantor 2D
- 🗺️ **Land Map** — Peta plot server room
- 📋 **Panel Taskbar** (bawah) — Toggle panel mengambang

### 5. Office Grid

Tampilan visual kantor dalam grid 8×8. Setiap karyawan punya meja. Status karyawan tercermin secara visual:
- 💚 Hijau = Sedang bekerja (ada task)
- 🔵 Biru = Idle (tidak ada task)
- 🔴 Merah = Happiness sangat rendah (risiko resign)

### 6. Server Room View

Tampilan grid server room tempat rack ditempatkan. Interaksi utama:
- **Drag & drop rack** dari Inventory ke grid
- **Klik rack** untuk membuka panel slot node
- **Drag & drop node** dari inventory ke slot rack kosong
- **Tombol `✕`** di node yang terpasang → unequip (kembalikan ke inventory)
- **Indikator warna rack:**
  - 🟣 Ungu = Normal
  - 🔴 Merah = Overheat (cooling used > capacity)
  - ⬜ Abu-abu = Kosong (belum ada node)

### 7. Panel Mengambang

4 panel bisa dibuka bersamaan, bisa di-drag, di-minimize, atau di-maximize:

| Panel | Isi |
|---|---|
| **Employees** | List karyawan, assign task, status happiness |
| **Features** | Build & upgrade fitur produk |
| **Server** | Server Shop (beli rack/node/rental), daftar rented server |
| **Finance** | Laporan pemasukan vs pengeluaran per bulan |

---

## Sistem & Logika Game

### Game Loop

Game berjalan dengan sistem tick berbasis `setInterval`:

```
setInterval(incrementTick, 2000 / speed)
```

- 1 tick ≈ 1 jam in-game
- **30 tick = 1 bulan** in-game
- Speed 1x = tick tiap 2 detik real-time
- Speed 4x = tick tiap 500ms

Setiap tick:
1. Semua karyawan yang punya task memproses progress
2. Jika progress selesai → komponen ditambahkan ke inventory
3. Happiness semua karyawan diupdate (turun saat bekerja)
4. Beban server dikalkulasi ulang dari total RPS
5. Overheat & crash node dicek
6. Setiap bulan → payroll + biaya server dipotong dari cash, revenue ditambahkan

### Sistem Karyawan

**Roles & Output:**

| Role | Menghasilkan |
|---|---|
| Designer | `ui_component`, `graphics_component` |
| Developer | `backend_code`, `network_module` |
| Lead Developer | Merakit komponen → Platform Feature |
| SysAdmin | Maintenance server, kurangi risiko crash |

**Atribut Employee:**
- `level (1–10)` — memengaruhi kecepatan produksi
- `happiness (0–100)` — turun saat bekerja, naik dari bonus
- `speed` — pengali produksi, dipengaruhi level × happiness:
  - happiness ≥ 80 → `speed = level × 1.2` (bonus)
  - happiness 30–79 → `speed = level × 1.0` (normal)
  - happiness < 30 → `speed = level × 0.5` (penalti)
- `resignTicks` — counter tick saat happiness < 15; setelah 10 tick, ada 20% chance resign per tick

**Happiness decay per tick:**
- Sedang mengerjakan task: **-1/tick**
- Idle (tidak ada task): **-0.2/tick**

### Sistem Produksi Komponen

Karyawan mengerjakan 1 komponen pada satu waktu. Progress dihitung per tick:

```
progress += employee.speed
if (progress >= componentDef.baseTicks) → komponen selesai, stok +1
```

Base production time tiap komponen adalah **20 tick** (≈ level 1 tanpa bonus).

### Sistem Fitur Platform

Lead Developer merakit komponen menjadi fitur:

```
buildFeature(featureId):
  cek requiredComponents tersedia di stok
  kurangi stok
  feature.level = 1
  feature.trafficGenerated = featDef.baseTraffic

upgradeFeature(featureId):
  cost = requiredComponents × (level + 1)
  feature.level++
  feature.trafficGenerated = baseTraffic × level
```

### Sistem Traffic

```
trafficGenerated (sum semua fitur aktif)
  ↓
users = totalTraffic
  ↓
rps   = totalTraffic
```

RPS ini yang masuk ke server tiap tick untuk dikalkulasi bebannya.

### Sistem Infrastruktur Server

#### Hierarki
```
Plot (lahan) → Rack (rak fisik) → Node (komponen server)
```

#### Rack Tiers

| Tier | Slot | Cooling Cap. | Harga | Biaya/bulan |
|---|---|---|---|---|
| Basic | 4 | 40 | $200 | $20 |
| Advanced | 6 | 80 | $500 | $50 |
| Enterprise | 8 | 150 | $1,200 | $100 |

#### Node Types

| Node | Fungsi | Kapasitas | Heat | Harga |
|---|---|---|---|---|
| Web Server T1 | Handle HTTP request | 100 RPS | 10 | $100 |
| Web Server T2 | Handle HTTP request | 250 RPS | 20 | $250 |
| Web Server T3 | Handle HTTP request | 500 RPS | 35 | $500 |
| Database T1 | Menyimpan data | 200 RPS | 15 | $150 |
| Database T2 | Menyimpan data | 500 RPS | 30 | $350 |
| Caching T1 | Offload web server | 200 RPS | 5 | $80 |
| Caching T2 | Offload web server | 500 RPS | 12 | $200 |
| Router | Distribusi traffic | — | 3 | $120 |
| Cooling Fan | +30 cooling cap | — | 0 | $50 |
| Industrial Fan | +60 cooling cap | — | 0 | $120 |
| Storage | +50 DB capacity | — | 8 | $90 |

#### Mekanik Beban & Panas

```
1. RPS total masuk ke semua rack
2. Caching server mengurangi RPS efektif (offload)
3. Sisa RPS dibagi rata ke semua Web Server aktif
   load = (RPS diterima / capacity) × 100%
4. Total heat semua node dikumpulkan per rack
5. Jika totalHeat > coolingCapacity → rack.isOverheating = true
6. Jika overheat ≥ 5 tick berturut → 5% chance crash per node per tick
7. Node crashed → load = 0, tidak handle RPS → users turun → revenue turun
```

**Biaya listrik:** `node.power × $2/bulan` per node (ditambah ke biaya bulanan).

#### Unequip vs Sell Node
- **Unequip** (tombol `✕` di slot) → node dikembalikan ke inventory, tidak ada refund/charge
- **Sell** (dari inventory panel) → node dijual, refund 50% dari harga beli

### Sistem Monetisasi

Pemasukan dihitung tiap akhir bulan:

```
Ads Revenue    = (users / 1000) × $2 × uptimePenalty
Subscription   = users × $0.5   (hanya jika Payment Gateway aktif)
Total Revenue  = Ads + Subscription

uptimePenalty  = 0.5 jika ada node crashed, 1.0 jika semua normal
```

### Sistem Keuangan

Tiap akhir bulan:
```
cashChange = Revenue - (totalSalary + serverCost)
cash += cashChange

serverCost = Σ(rack.monthlyCost) + Σ(node.monthlyCost) + Σ(node.power × 2) + Σ(rentedServer.monthlyCost)
```

**Kondisi Game Over (Bangkrut):**
- Jika `cash < 0` → `negativeCashMonths++`
- Jika `negativeCashMonths >= 3` → `isBankrupt = true` → Game Over Screen

### Sistem Save/Load

Data disimpan ke **IndexedDB** via Dexie.js. Field yang disimpan:

| Field | Keterangan |
|---|---|
| `tick`, `speed`, `month` | State waktu |
| `cash`, `totalSalary` | Keuangan |
| `employees` | Semua data karyawan |
| `resources` | Stok komponen |
| `features` | Status build fitur |
| `racks` | Semua rack + node di dalamnya |
| `plots` | Lahan server room |
| `rentedServers` | Server yang disewa |
| `inventoryNodes` | Node di inventory (belum dipasang) |
| `activeView` | View terakhir (kantor/server room) |
| `visitedPlots` | Plot yang pernah dikunjungi |
| `screen` | State screen (menu/select/playing) |
| `isBankrupt`, `negativeCashMonths` | Status bangkrut |

Autosave berjalan tiap **60 detik** real-time saat game aktif.

---

## Alur Data (Game Loop)

```
incrementTick()  [dipanggil tiap interval]
       │
       ├── Update progress & produksi komponen tiap karyawan
       ├── Update happiness & speed tiap karyawan
       ├── Cek resign (happiness < 15 selama 10 tick)
       │
       ├── calculateNodeLoads(racks, rps)
       │       ├── calcServerStats() → total web capacity, cache offload
       │       ├── Distribusi RPS → load per web server
       │       ├── Hitung heat total per rack
       │       └── Trigger overheat / crash logic
       │
       └── (Jika bulan baru):
               ├── calcTotalSalary()
               ├── calcMonthlyServerCost()
               ├── calculateRevenue(users, features, racks)
               ├── cash += revenue - (salary + serverCost)
               └── Cek bankruptcy condition
```

---

## Data & Balancing

*(Baseline awal, bisa dituning setelah playtest)*

| Parameter | Nilai |
|---|---|
| Cash awal | $10,000 |
| Gaji karyawan level 1 | $500/bulan |
| Ticks per bulan | 30 tick |
| Base produksi 1 komponen | 20 tick |
| Happiness decay (kerja) | -1/tick |
| Happiness decay (idle) | -0.2/tick |
| Threshold resign | < 15 happiness selama 10 tick |
| Chance resign | 20% per tick setelah threshold |
| Overheat threshold | 5 tick berturut-turut |
| Crash chance (overheat) | 5% per node per tick |
| Ads revenue | $2 per 1000 users/bulan |
| Subscription revenue | $0.5 per user/bulan |
| Uptime penalty (crash) | 50% revenue |
| Bangkrut setelah | 3 bulan cash negatif |
| Node sell refund | 50% dari harga beli |
| Rack sell refund | 50% dari harga beli (harus kosong) |

---

## Roadmap

Lihat [`docs/01_PLAN.md`](docs/01_PLAN.md) untuk rencana lengkap, dan [`docs/02_TASK.md`](docs/02_TASK.md) untuk checklist per fase.

| Fase | Status | Keterangan |
|---|---|---|
| Fase 1 — Excel Phase | ✅ Selesai | Game loop, karyawan, komponen, keuangan |
| Fase 2 — Server Management | ✅ Selesai | Rack, node, overheat, monetisasi, happiness |
| Fase 3 — Visual Kantor | ✅ Selesai | Office grid 2D, sprite karyawan |
| Fase 4 — Tauri & Desktop | ✅ Selesai | Save/Load IndexedDB, build .exe |
| Post-MVP | 🔄 Ongoing | Balancing, Polish UI, Main Menu, fitur tambahan |

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
