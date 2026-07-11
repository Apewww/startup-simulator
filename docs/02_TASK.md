# Task Breakdown
## Tech Startup Simulator (Personal Project)

Checklist kerja per fase. Centang `[x]` setiap task selesai. Urutan disusun agar tiap task bisa langsung dites hasilnya.

---

## FASE 1 — Excel Phase (Logika Murni)

### 1.1 Setup Project
- [x] Install Rust & prasyarat Tauri (`rustup`, dependency OS sesuai platform)
- [x] `npm create tauri-app@latest` → pilih React + TypeScript
- [x] Setup Tailwind CSS di project
- [x] Install Zustand: `npm install zustand`
- [x] Install Dexie.js: `npm install dexie`
- [x] Setup struktur folder: `src/store`, `src/types`, `src/systems`, `src/components`, `src/data`
- [x] Commit awal ke Git (`git init`, `.gitignore` untuk `node_modules`, `target`, dsb)

### 1.2 Tipe Data Dasar
- [x] Buat `src/types/employee.ts` — interface `Employee`
- [x] Buat `src/types/resource.ts` — interface `ComponentResource`
- [x] Buat `src/types/server.ts` — interface `ServerInstance`
- [x] Buat `src/types/feature.ts` — interface `PlatformFeature`
- [x] Buat `src/types/company.ts` — interface `Company` (cash, month, dsb)

### 1.3 Game Loop Dasar
- [x] Buat `src/store/gameStore.ts` (Zustand) dengan state: `tick`, `isPaused`, `speed` (1x/2x/4x)
- [x] Implementasi loop menggunakan `setInterval`
- [x] Tombol UI: Pause, Play, 1x, 2x, 4x
- [x] Test: tick bertambah sesuai speed, berhenti saat pause

### 1.4 Sistem Keuangan Dasar
- [x] Tambah field `cash` di `Company` store
- [x] Fungsi `deductSalaries()` dipanggil tiap akhir "bulan" in-game (definisikan berapa tick = 1 bulan)
- [x] Tampilkan saldo real-time di UI (boleh teks polos dulu)
- [x] Test: saldo berkurang otomatis tiap bulan sesuai total gaji karyawan

### 1.5 Sistem Karyawan Dasar
- [x] Fungsi `hireEmployee(role, level)` — generate data karyawan baru & masukkan ke store
- [x] UI sederhana: tombol "Rekrut Developer/Designer/dst" + list karyawan (teks/table)
- [x] Fungsi produksi: karyawan mengerjakan 1 `ComponentResource`, progress dihitung per tick berdasarkan `speed`
- [x] Tampilkan progress bar tekstual (misal `Progress: 45%`) per karyawan
- [x] Test: karyawan menghasilkan komponen setelah waktu produksi selesai, stok bertambah

**Milestone Fase 1 selesai:** Bisa buka app, rekrut karyawan, lihat saldo berkurang tiap bulan, dan karyawan menghasilkan komponen — semua lewat UI teks sederhana tanpa styling rumit.

---

## FASE 2 — Platform & Server Management

### 2.1 Pemilihan Produk Awal
- [x] Buat data statis 3 produk (`src/data/products.ts`): Social Media, E-Commerce, Search Engine — masing-masing dengan daftar fitur unik
- [x] UI: layar awal game — pilih 1 dari 3 produk
- [x] Simpan pilihan produk ke `Company` store

### 2.2 Sistem Fitur (Platform Feature)
- [x] Fungsi `buildFeature(featureId)` — cek `requiredComponents` cukup → kurangi stok → tambah fitur ke daftar aktif
- [x] Fungsi `upgradeFeature(featureId)` — level naik, butuh komponen lebih banyak/kualitas lebih tinggi
- [x] UI panel: daftar fitur yang bisa dibangun/upgrade + requirement-nya
- [x] Test: fitur berhasil dibangun saat komponen cukup, gagal (dengan pesan jelas) saat kurang

### 2.3 Kalkulasi Traffic
- [x] Fungsi hitung total `trafficGenerated` dari semua fitur aktif
- [x] Konversi traffic → jumlah `users` (rumus sederhana dulu, linear)
- [x] Konversi `users` → `RPS` yang membebani server
- [x] Tampilkan `users` dan `RPS` di dashboard

### 2.4 Sistem Server (Rack + Node + Cooling) ✅
Server tidak dibeli langsung — pemain harus beli **rack** dulu, lalu pasang **node** (server, fan, router, dll) ke slot rack. Ada mekanik **panas/cooling** yang memengaruhi stabilitas.

#### 2.4.1 Tipe Data Server
- [x] Buat `src/types/server.ts` — interface `ServerInstance`, `ServerType` (sudah ada, diperluas)
- [x] Buat tipe baru: `RackTier`, `NodeType`, `ServerNode`, `ServerRack`, `RackSlot`, `NodeDef`, `RackDef`
- [x] Update barrel export `src/types/index.ts`

#### 2.4.2 Data Server
- [x] Buat `src/data/servers.ts`:
  - Data rack tiers (Basic/Advanced/Enterprise: slot, cooling, price, monthly)
  - Data node definitions (Web T1-T3, DB T1-T2, Caching T1-T2, Router, Cooling Fan, Industrial Fan, Storage)

#### 2.4.3 Store & Logic
- [x] Tambah state `racks: ServerRack[]` ke `gameStore`
- [x] Fungsi `buyRack(tier)` — beli rack, kurangi cash, tambah ke store
- [x] Fungsi `buyNode(rackId, nodeTypeId)` — beli node, kurangi cash, pasang di slot kosong pertama
- [x] Fungsi `sellNode(rackId, slotIndex)` — jual node (50% refund), hapus dari slot
- [x] Fungsi `sellRack(rackId)` — jual rack (harus kosong, 50% refund)
- [x] Di `incrementTick`: hitung distribusi RPS ke web server → `load` per node
- [x] Hitung total heat vs cooling capacity per rack → deteksi overheat
- [x] Trigger crash saat overheat berkepanjangan (≥5 tick overheat → 5% chance crash per tick)
- [x] Tambah biaya bulanan server ke monthly billing (salary + server cost dipotong bersamaan)
- [x] Efek SysAdmin: mempercepat recovery, kurangi chance crash ✅ V1.3.2

#### 2.4.4 UI Server Panel
- [x] Panel utama: daftar rack dengan status (online/overheat/cooling used / total cooling)
- [x] Dalam tiap rack: daftar slot + isi node dengan load bar / status
- [x] Tombol beli rack (pilih tier) dan beli node (pilih jenis dari data)
- [x] Visual: progress bar load per server, indikator overheat (warna merah/oranye)
- [x] Detail node: kapasitas, heat, power, biaya

#### 2.4.5 Test & Verifikasi
- [x] Test: beli rack → beli node → RPS masuk → load terlihat → overheat → crash *(manual)* ✅ V1.3.2
- [x] Test: cooling fan bisa menunda/mencegah overheat *(manual)* ✅ V1.3.2
- [x] Test: biaya bulanan server terpotong dari cash *(di store incrementTick)*

### 2.5 Sistem Monetisasi ✅
- [x] Fungsi `calculateAdsRevenue()` — berdasarkan users/RPS
- [x] Fungsi `calculateSubscriptionRevenue()` — berdasarkan users aktif, requires fitur pembayaran dibangun dulu
- [x] Tambahkan revenue ke `cash` tiap tick/bulan sesuai desain
- [x] UI: breakdown pemasukan vs pengeluaran (List sederhana dulu, chart menyusul)

### 2.6 Sistem Happiness & Resign ✅
- [x] Fungsi decay happiness per tick (kerja vs idle)
- [x] Fungsi efek happiness terhadap `speed`
- [x] Fungsi kemungkinan resign saat happiness < threshold
- [x] UI: indikator happiness per karyawan (angka atau warna)

### 2.7 Kondisi Bankrupt
- [x] Fungsi cek saldo negatif berkepanjangan → trigger game over screen
- [x] UI: layar game over sederhana dengan opsi restart

**Milestone Fase 2 selesai:** Loop penuh bisa dimainkan — dari 0 karyawan sampai punya fitur, users, server, dan pendapatan — dengan risiko nyata bangkrut/crash.

---

## FASE 3 — Visual Kantor

- [x] Desain grid kantor sederhana (8x8 petak) — pakai CSS Grid dulu (lebih cepat dari Canvas)
- [x] Render meja per karyawan yang direkrut (posisi otomatis mengisi grid)
- [x] Sprite/ikon karyawan berubah warna/status sesuai `currentTask` (bekerja/idle/istirahat)
- [x] Sinkronisasi: setiap update state karyawan di store, visual ikut update (pakai Zustand subscribe atau React re-render biasa)
- [x] (Opsional) Animasi progress bar mengambang di atas meja karyawan yang sedang bekerja

**Milestone Fase 3 selesai:** Kantor terlihat sebagai grid visual, bukan cuma tabel data — cukup untuk memberi rasa "ruang kerja hidup" tanpa perlu sprite artistik detail.

---

## FASE 4 — Integrasi Tauri & Build Desktop

- [x] Setup Dexie.js schema untuk save game (`GameSave` table: snapshot seluruh store)
- [x] Fungsi `saveGame()` — serialize Zustand store → simpan ke IndexedDB
- [x] Fungsi `loadGame()` — ambil dari IndexedDB → hydrate Zustand store
- [x] UI: tombol Save/Load manual + (opsional) autosave tiap X menit in-game
- [x] Konfigurasi `tauri.conf.json` (nama app, ukuran window, icon)
- [x] Build production: `npm run tauri build`
- [x] Test hasil `.exe` di luar environment dev — pastikan save/load tetap jalan

**Milestone Fase 4 selesai:** Ada file `.exe` yang bisa dibuka langsung, progres tersimpan, dan game bisa dilanjutkan kapan saja.

---

## Setelah Semua Fase Selesai (Opsional, Nice-to-Have)

- [x] Tuning balancing angka berdasarkan playtest sendiri (rujuk baseline di `03_GDD.md` bagian 7) ✅ V1.3
- [x] Tambah lebih banyak varian fitur per produk ✅ V1.3 (+2 per produk)
- [x] Tambah grafik cash flow (inline SVG, zero deps) ✅ V1.3.1
- [x] Sistem investor/funding round sederhana ✅ V1.3.2
- [x] Polish UI (transisi, animasi, empty state, micro-interactions) ✅ V1.3

---

## V1.4 — Lead Developer: Data Model & Supervisi Dasar

- [ ] Type: `supervisedBy` + `supervising` di `Employee` interface
- [ ] Validasi role (Lead_Developer → supervising, Developer → supervisedBy)
- [ ] Cap: `maxSupervised = 2 + (level - 1) * 1`
- [ ] Action: `assignDeveloperToLead(leadId, devId)`
- [ ] Action: `unassignDeveloperFromLead(devId)`
- [ ] Edge case — developer resign: auto unassign dari lead
- [ ] Edge case — lead resign: semua dev di bawahnya auto unassign
- [ ] UI Lead card: badge "Supervising: X/Y"
- [ ] UI Dev card: badge "Supervised by [Name]" jika ada
- [ ] UI Assign panel: checkbox list developer available
- [ ] UI: disable assign saat cap penuh
- [ ] Save/load: Dexie version 8
- [ ] Build sukses (typecheck + lint)

---

## V1.4.2 — Lead Developer: UI Polish & Visual Feedback

- [ ] OfficeGrid.tsx — lead desk: star icon + indigo border
- [ ] OfficeGrid.tsx — supervised desk: dot indicator + tooltip update
- [ ] EmployeesPanel.tsx — tooltip lead: "Supervising: X/Y (+X% boost each)"
- [ ] EmployeesPanel.tsx — tooltip dev: "Supervised by [Name] (+X% output)"
- [ ] HudBar.tsx — supervision active indicator
- [ ] Build sukses (typecheck + lint)

---

## V1.4.3 — Office Grid Refactor: Modular Positioning

- [ ] `employee.ts`: hapus `deskIndex`, tambah `gridX`/`gridY` + `OfficeSlot` type
- [ ] `gameStore.ts`: state `officeGridCols: 8`, `officeGridRows: 8`
- [ ] `gameStore.ts`: action `moveEmployee(empId, x, y)` — validasi bounds & collision
- [ ] `gameStore.ts`: update `hireEmployee` — pakai `gridX`/`gridY` cari slot kosong
- [ ] `gameStore.ts`: update `restartGame` — reset grid size
- [ ] `OfficeGrid.tsx`: refactor ke coordinate-based grid (absolute positioning, drag & drop)
- [ ] `OfficeGrid.tsx`: ghost overlay + collision check saat drag
- [ ] `OfficeGrid.tsx`: grid labels (col/row numbers)
- [ ] `OfficeGrid.tsx`: pertahankan visual dari v1.4.2 (star, dot, ring, progress bar)
- [ ] `gameDB.ts`: bump Dexie version to 9, tambah field di `GameSave`
- [ ] `saveLoad.ts`: migrasi `deskIndex` → `gridX`/`gridY` untuk save lama
- [ ] `saveLoad.ts`: save/load `officeGridCols`/`officeGridRows`
- [ ] Build sukses (typecheck + lint)

---

## V1.4.4 — Furniture Perk/Unlock System (Perk Points)

- [ ] `data/milestones.ts`: `MILESTONES` (10 fixed + 1 repeatable `survival_6mo`) + `PerkContext`
- [ ] `data/perks.ts`: `PERKS` (Coffee Machine, Ergonomic Chair, Water Dispenser, cost 1) + `PerkDef`
- [ ] `gameStore.ts`: state `perkPoints` / `earnedMilestones` / `unlockedPerks`
- [ ] `gameStore.ts`: action `checkMilestones` (fixed + repeatable, award point + notif)
- [ ] `gameStore.ts`: action `unlockPerk(perkId)` (guard + spend + notif)
- [ ] `gameStore.ts`: `incrementTick` panggil `checkMilestones`
- [ ] `gameStore.ts`: `restartGame` reset perk state
- [ ] `gameStore.ts`: `PanelId` + `'perks'` di panelOpen/Minimized
- [ ] `PerksPanel.tsx`: tab Milestones (progress bar + clear state)
- [ ] `PerksPanel.tsx`: tab Unlock (buy button + owned state)
- [ ] `Dock.tsx`: tombol Perks (shortcut 6)
- [ ] `App.tsx`: `FloatingPanel` Perks
- [ ] `gameDB.ts`: bump Dexie v10 + field `GameSave`
- [ ] `saveLoad.ts`: save/load 3 field baru
- [ ] Build sukses (typecheck + lint)
- [ ] Test: hire 5 employee → notif "+1 Perk Point"
- [ ] Test: unlock perk → point turun, masuk `unlockedPerks`
- [ ] Test: save/load perk state persist
- [ ] Test: restart → perk state reset

