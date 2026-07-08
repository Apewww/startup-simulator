# Game Design Document (GDD)
## Tech Startup Simulator — "Klon Startup Company" (Personal Project)

Versi: 0.1 — Untuk penggunaan pribadi, tidak untuk rilis komersial.

---

## 1. Ringkasan Game

**Judul kerja:** Tech Startup Simulator
**Genre:** Business/Tycoon Simulation, Management
**Platform:** Desktop (Windows) via Tauri
**Perspektif:** 2D top-down / isometric ringan (kantor), UI-heavy dashboard
**Referensi utama:** *Startup Company* (Hovgaard Games)
**Target pemain:** Diri sendiri (single player, offline)

**Elevator pitch:**
Pemain membangun perusahaan software dari garasi menjadi perusahaan teknologi besar. Rekrut karyawan, produksi modul software, bangun fitur produk, kelola server, cari investor, dan jangan sampai perusahaan bangkrut atau server crash karena overload.

---

## 2. Core Gameplay Loop

```
Rekrut Karyawan → Karyawan Produksi Komponen → Komponen Dirakit Jadi Fitur
       → Fitur Ditambahkan ke Produk → Traffic/User Naik
       → Server Menangani Beban → Monetisasi (Ads/Subscription)
       → Uang Masuk → Reinvest (rekrut lebih banyak, upgrade server, riset fitur baru)
       → (loop berulang, skala makin besar)
```

Loop sekunder: **Manajemen kebahagiaan karyawan** agar produktivitas tidak turun, dan **manajemen beban server** agar tidak crash.

---

## 3. Pilar Desain

1. **Angka yang jujur** — semua sistem berbasis simulasi numerik yang bisa dipahami pemain (transparan, bukan random hidden).
2. **Trade-off yang jelas** — setiap keputusan (misal: gaji tinggi vs profit, server murah vs risiko crash) punya konsekuensi nyata.
3. **Progresi yang terasa** — dari 1 karyawan di garasi sampai puluhan karyawan dan data center sendiri.
4. **Kegagalan itu instruktif** — bangkrut/crash server harus memberi sinyal jelas ke pemain kenapa itu terjadi, bukan terasa acak.

---

## 4. Sistem Inti

### 4.1 Karyawan (Employee System)

**Role:**
| Role | Fungsi | Menghasilkan |
|---|---|---|
| Designer | Desain visual | UI Component, Graphics Component |
| Developer | Coding | Backend Code, Network Module |
| Lead Developer | Integrasi | Merakit komponen jadi Platform Feature |
| SysAdmin | Infrastruktur | Maintain & upgrade server, kurangi risiko crash |

**Atribut:**
- `level` (1–10): memengaruhi kualitas & kecepatan output.
- `speed`: pengali kecepatan produksi (dipengaruhi level + happiness).
- `happiness` (0–100): di bawah 30 → produktivitas turun tajam & risiko resign; di atas 80 → bonus kecepatan.
- `salary`: dibayar otomatis tiap akhir bulan in-game.
- `currentTask`: id komponen/fitur yang sedang dikerjakan.

**Mekanik rekrutmen:**
- Job posting → kandidat muncul random dengan atribut acak (level, expected salary).
- Pemain pilih terima/tolak.
- Semakin tinggi level kandidat, semakin tinggi ekspektasi gaji.

**Mekanik happiness:**
- Turun perlahan tiap tick (kerja terus-menerus).
- Naik dari: bonus, fasilitas kantor (kursi, kopi, dsb — opsional visual), gaji di atas ekspektasi.
- Efek: happiness rendah → speed turun, kemungkinan resign per tick meningkat.

### 4.2 Produksi Komponen (Resource Crafting)

Alur produksi berjenjang:
```
Designer  → UI Component, Graphics Component
Developer → Backend Code, Network Module
Lead Dev  → gabungkan N komponen → 1 Platform Feature
```

- Tiap komponen punya waktu produksi dasar (base time), dikurangi oleh `speed` karyawan.
- Komponen disimpan sebagai stok (quantity) di gudang virtual, dipakai Lead Developer saat merakit fitur.
- Fitur butuh kombinasi resource spesifik (`requiredComponents`), didefinisikan per fitur.

### 4.3 Produk & Fitur (Platform Feature System)

- Pemain pilih 1 jenis produk di awal game: **Social Media**, **E-Commerce**, atau **Search Engine**.
- Tiap produk punya daftar fitur unik yang bisa dibangun/upgrade (contoh E-Commerce: Product Listing, Shopping Cart, Payment Gateway, Review System).
- Tiap fitur punya `level` — semakin tinggi level, semakin besar `trafficGenerated`.
- Upgrade fitur = butuh lebih banyak/lebih tinggi kualitas komponen.

### 4.4 Traffic & Monetisasi

- Total `trafficGenerated` dari semua fitur → dikonversi jadi **Users** dan **RPS (Request Per Second)**.
- RPS ini yang membebani server (lihat 4.5).
- Monetisasi:
  - **Ads Contract**: pendapatan per 1000 request/user, kontrak bisa naik/turun sesuai performa (uptime).
  - **Subscription**: pendapatan tetap per user aktif per bulan, tapi butuh fitur tertentu (misal payment system) untuk unlock.
- Uptime buruk (karena server crash) → menurunkan rating platform → pengguna & pendapatan turun.

### 4.5 Infrastruktur Server

Sistem server didesain seperti data center mini: pemain membeli **rack** terlebih dahulu, lalu memasang **node** ke dalam slot rack. Setiap node memiliki fungsi, kapasitas, panas, dan biaya sendiri.

#### 4.5.1 Rack

Rack adalah infrastruktur fisik tempat semua node dipasang.

| Tier | Slot | Harga Beli | Biaya/bulan | Kapasitas Cooling | Konsumsi Daya Dasar |
|---|---|---|---|---|---|
| Basic | 4 | $200 | $20 | 40 unit | 5 watt |
| Advanced | 6 | $500 | $50 | 80 unit | 10 watt |
| Enterprise | 8 | $1.200 | $100 | 150 unit | 20 watt |

Setiap rack memiliki:
- **Cooling Capacity** — batas maksimum panas yang bisa ditangani.
- **Cooling Used** — total panas dari semua node aktif di rack.
- **Power Draw** — total daya dari semua node (memengaruhi biaya listrik bulanan).
- Jika `coolingUsed > coolingCapacity` → rack overheating → risiko crash node.

#### 4.5.2 Node

Node adalah komponen yang dipasang di slot rack. Pemain harus membeli node dan menempatkannya di slot yang tersedia.

| Node | Fungsi | Kapasitas | Panas (heat) | Daya (power) | Harga Beli | Biaya/bulan |
|---|---|---|---|---|---|---|
| Web Server T1 | Menangani request HTTP | 100 RPS | 10 | 5 | $100 | $15 |
| Web Server T2 | Menangani request HTTP | 250 RPS | 20 | 10 | $250 | $35 |
| Web Server T3 | Menangani request HTTP | 500 RPS | 35 | 20 | $500 | $70 |
| Database T1 | Menyimpan data user | 50 RPS | 15 | 8 | $150 | $25 |
| Database T2 | Menyimpan data user | 150 RPS | 30 | 16 | $350 | $55 |
| Caching T1 | Mempercepat response (offload) | 200 RPS | 5 | 3 | $80 | $10 |
| Caching T2 | Mempercepat response (offload) | 500 RPS | 12 | 8 | $200 | $25 |
| Router | Distribusi traffic & efisiensi | — (unlimited) | 3 | 5 | $120 | $20 |
| Cooling Fan | Tambahan pendingin | +30 cooling | — | 2 | $50 | $8 |
| Industrial Fan | Tambahan pendingin besar | +60 cooling | — | 4 | $120 | $15 |
| Storage | Tambah kapasitas database | +50 DB cap | 8 | 6 | $90 | $12 |

**Fungsi Node Khusus:**
- **Router:** Diperlukan jika total node > 3 dalam satu rack. Memberikan +5% efisiensi per router.
- **Cooling Fan / Industrial Fan:** Menambah cooling capacity rack.
- **Storage:** Menambah kapasitas penyimpanan database server.
- **Caching Server:** Mengurangi RPS yang mencapai web server (offload).

#### 4.5.3 Mekanik Beban & Panas

1. **Distribusi RPS:** Traffic masuk didistribusikan merata ke semua Web Server aktif.
2. **Load tiap server:** `load = (RPS diterima / capacity) * 100%`.
3. **Total panas rack:** `sum(heat)` dari semua node aktif.
4. **Overheat:** Jika `totalHeat > coolingCapacity` selama ≥5 tick berturut-turut.
5. **Saat overheat:**
   - Semua node di rack terkena penalty speed (-30%).
   - Setiap tick tambahan overheat → 5% chance random node crash.
6. **Crash:** Node mati total, fitur yang bergantung kehilangan kapasitas, users turun drastis.
7. **Recovery:** SysAdmin otomatis memperbaiki node setelah N tick (lebih cepat dengan level SysAdmin tinggi). Atau pemain bisa bayar perbaikan instan.

#### 4.5.4 Biaya

- Biaya server di `monthlyBilling()` = `sum(monthlyCost semua node) + sum(monthlyCost semua rack) + sum(powerDraw * 2)`.
- Listrik dipengaruhi total daya (power draw) semua node.
- Pemain bisa menjual node (50% refund) atau menjual rack (harus kosong, 50% refund).

### 4.6 Keuangan Perusahaan

- Saldo perusahaan (cash) berkurang tiap bulan in-game oleh: gaji karyawan + biaya server + biaya kantor.
- Bertambah dari: pendapatan Ads/Subscription, investasi (funding round).
- **Kondisi Game Over:** saldo negatif berkepanjangan (misal < 0 selama 3 bulan in-game) → bankrupt.
- Opsional lanjutan: sistem **Investor/Funding Round** — pemain presentasi metrik (users, growth rate) untuk dapat suntikan dana besar dengan menyerahkan sebagian ekuitas (silent, bisa disederhanakan untuk versi pribadi).

### 4.7 Waktu / Game Loop

- 1 "tick" = representasi waktu simulasi (misal 1 tick = 1 jam in-game, bisa dipercepat).
- Kontrol kecepatan: Pause / 1x / 2x / 4x.
- Bulan in-game = pemicu payroll & billing server.

---

## 5. UI/UX (Scope MVP)

- **Dashboard utama:** saldo, users, RPS, uptime, waktu game, tombol speed.
- **Panel Karyawan:** list karyawan + status (task, happiness, speed), tombol rekrut.
- **Panel Produk/Fitur:** tree/daftar fitur yang bisa dibangun & di-upgrade, requirement komponen.
- **Panel Server:** daftar server, load bar per server, tombol upgrade/beli.
- **Panel Keuangan:** grafik cash flow sederhana, breakdown pengeluaran vs pemasukan.
- Visual kantor (grid karyawan duduk di meja) — fitur non-esensial, dikerjakan di fase visual (fase 3 di roadmap).

---

## 6. Scope untuk Versi Personal (MVP realistis)

Karena ini untuk main sendiri, GDD ini sengaja dibatasi supaya **selesai dan playable**, bukan sekomplet game aslinya. Fitur yang **di-drop dari Startup Company** untuk MVP:

- Tidak ada multiple office room/lantai kompleks — cukup 1 ruangan grid sederhana.
- Tidak ada sistem kompetitor AI startup lain.
- Tidak ada mini-game/hacking sequence.
- Sistem investor disederhanakan jadi 1-2 keputusan besar saja, bukan negosiasi kompleks.

Fitur yang **dipertahankan** karena jadi ciri khas game ini:
- Employee production chain
- Server load & crash
- Feature building per produk
- Cash flow & payroll bulanan

---

## 7. Balancing Awal (Baseline Numbers — bisa dituning nanti)

Ini asumsi awal untuk dev, ditulis eksplisit karena "hidden random number" gampang bikin loop tidak jujur:

- Base produksi 1 unit komponen level-1: 20 tick.
- Base salary level-1: $500/bulan in-game, naik ~15% per level.
- Base server capacity level-1: 100 RPS, cost $50/bulan.
- Happiness decay: -1/tick kerja, -0.2/tick idle; naik +5 per bonus manual.
- Threshold resign: happiness < 15 selama 10 tick berturut → 20% chance resign per tick tambahan.

---

## 8. Struktur Data Acuan (dari dokumen awal, dipertahankan)

```ts
export interface Employee {
  id: string;
  name: string;
  role: 'Developer' | 'Designer' | 'Lead_Developer' | 'SysAdmin';
  level: number;
  salary: number;
  happiness: number;
  speed: number;
  currentTask: string | null;
}

export interface ComponentResource {
  id: string;
  name: string;
  quantity: number;
}

export interface ServerInstance {
  id: string;
  type: 'Web_Server' | 'Database_Server' | 'Caching_Server';
  capacity: number;
  load: number;
  monthlyCost: number;
}

export interface PlatformFeature {
  id: string;
  name: string;
  level: number;
  requiredComponents: { componentId: string; amount: number }[];
  trafficGenerated: number;
}
```

---

## 9. Kondisi Menang/Kalah

- **Tidak ada "menang" formal** (sandbox tycoon) — target opsional pribadi: capai 100.000 users aktif, atau saldo $1.000.000.
- **Kalah:** bankrupt (saldo negatif berkepanjangan).
