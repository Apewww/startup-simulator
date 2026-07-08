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
- [ ] Fungsi `buildFeature(featureId)` — cek `requiredComponents` cukup → kurangi stok → tambah fitur ke daftar aktif
- [ ] Fungsi `upgradeFeature(featureId)` — level naik, butuh komponen lebih banyak/kualitas lebih tinggi
- [ ] UI panel: daftar fitur yang bisa dibangun/upgrade + requirement-nya
- [ ] Test: fitur berhasil dibangun saat komponen cukup, gagal (dengan pesan jelas) saat kurang

### 2.3 Kalkulasi Traffic
- [ ] Fungsi hitung total `trafficGenerated` dari semua fitur aktif
- [ ] Konversi traffic → jumlah `users` (rumus sederhana dulu, linear)
- [ ] Konversi `users` → `RPS` yang membebani server
- [ ] Tampilkan `users` dan `RPS` di dashboard

### 2.4 Sistem Server
- [ ] Fungsi `buyServer(type)` — tambah `ServerInstance` baru ke store
- [ ] Fungsi hitung `load` per server = `(RPS masuk / capacity) * 100`
- [ ] UI: panel server dengan load bar per instance
- [ ] Trigger crash: jika `load >= 100%` selama N tick berturut → set fitur terkait nonaktif sementara + kurangi rating
- [ ] Biaya server (`monthlyCost`) ikut terpotong di `deductSalaries()`/fungsi billing bulanan (rename jadi `monthlyBilling()`)
- [ ] Test: overload server memicu crash, saldo tetap terpotong biaya server tiap bulan

### 2.5 Sistem Monetisasi
- [ ] Fungsi `calculateAdsRevenue()` — berdasarkan users/RPS
- [ ] Fungsi `calculateSubscriptionRevenue()` — berdasarkan users aktif, requires fitur pembayaran dibangun dulu
- [ ] Tambahkan revenue ke `cash` tiap tick/bulan sesuai desain
- [ ] UI: breakdown pemasukan vs pengeluaran (List sederhana dulu, chart menyusul)

### 2.6 Sistem Happiness & Resign
- [ ] Fungsi decay happiness per tick (kerja vs idle)
- [ ] Fungsi efek happiness terhadap `speed`
- [ ] Fungsi kemungkinan resign saat happiness < threshold
- [ ] UI: indikator happiness per karyawan (angka atau warna)

### 2.7 Kondisi Bankrupt
- [ ] Fungsi cek saldo negatif berkepanjangan → trigger game over screen
- [ ] UI: layar game over sederhana dengan opsi restart

**Milestone Fase 2 selesai:** Loop penuh bisa dimainkan — dari 0 karyawan sampai punya fitur, users, server, dan pendapatan — dengan risiko nyata bangkrut/crash.

---

## FASE 3 — Visual Kantor

- [ ] Desain grid kantor sederhana (misal 8x8 petak) — pakai CSS Grid dulu (lebih cepat dari Canvas)
- [ ] Render meja per karyawan yang direkrut (posisi otomatis mengisi grid)
- [ ] Sprite/ikon karyawan berubah warna/status sesuai `currentTask` (bekerja/idle/istirahat)
- [ ] Sinkronisasi: setiap update state karyawan di store, visual ikut update (pakai Zustand subscribe atau React re-render biasa)
- [ ] (Opsional) Animasi progress bar mengambang di atas meja karyawan yang sedang bekerja

**Milestone Fase 3 selesai:** Kantor terlihat sebagai grid visual, bukan cuma tabel data — cukup untuk memberi rasa "ruang kerja hidup" tanpa perlu sprite artistik detail.

---

## FASE 4 — Integrasi Tauri & Build Desktop

- [ ] Setup Dexie.js schema untuk save game (`GameSave` table: snapshot seluruh store)
- [ ] Fungsi `saveGame()` — serialize Zustand store → simpan ke IndexedDB
- [ ] Fungsi `loadGame()` — ambil dari IndexedDB → hydrate Zustand store
- [ ] UI: tombol Save/Load manual + (opsional) autosave tiap X menit in-game
- [ ] Konfigurasi `tauri.conf.json` (nama app, ukuran window, icon)
- [ ] Build production: `npm run tauri build`
- [ ] Test hasil `.exe` di luar environment dev — pastikan save/load tetap jalan

**Milestone Fase 4 selesai:** Ada file `.exe` yang bisa dibuka langsung, progres tersimpan, dan game bisa dilanjutkan kapan saja.

---

## Setelah Semua Fase Selesai (Opsional, Nice-to-Have)

- [ ] Tuning balancing angka berdasarkan playtest sendiri (rujuk baseline di `03_GDD.md` bagian 7)
- [ ] Tambah lebih banyak varian fitur per produk
- [ ] Tambah grafik cash flow (pakai library chart ringan)
- [ ] Sistem investor/funding round sederhana
- [ ] Polish UI (transisi, sound effect dasar)
