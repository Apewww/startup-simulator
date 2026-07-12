# Update V1.5 — Product Monetization Rebalance: Fase A (Foundation)

**Induk:** `docs/upcoming_features v2.md` → **Fase A — Foundation (Data & Types, tanpa ubah gameplay aktif)**
**Tujuan:** Letakkan fondasi data & tipe untuk rebalance monetisasi + cooling system tanpa mengubah perilaku game yang sudah jalan. Semua logic aktif (tier Ads, B2B, overheat ratio, heat spread) menyusul di Fase B–G.

> **Catatan rekonsiliasi:** Saat dokumen `upcoming_features v2.md` ditulis, beberapa fondasi sudah ada di kode. Fase A disesuaikan dengan kondisi kode saat ini (Dexie sudah **v11**, bukan v7; `ServerNode.heat` & `coolingCapacity` rack sudah ada). Penyesuaian angka heat/cooling ke tabel §6.1/§6.3 **disengaja dikerjakan di Fase A** sesuai keputusan balancing.

---

## 1. Type System — Server

### `src/types/server.ts` — `ServerRack`

Tambah dua field baru (Fase D nanti yang mengisi/membaca):

```ts
export interface ServerRack {
  // ... existing fields
  isOverheating: boolean;
  overheatTicks: number;
  heatRatio: number;          // NEW — diisi Fase D (totalHeat / totalCooling)
  adjacentRackIds: string[];  // NEW — rack tetangga (berbagi sisi grid) dalam plot yang sama
}
```

- `ServerNode.heat` **sudah ada** (`src/types/server.ts:20`) → memenuhi `heatGenerated` dari doc Fase A; tidak perlu field baru di node.
- Field diinisialisasi `heatRatio: 0`, `adjacentRackIds: []` saat rack dibuat (`buyRack` di `gameStore.ts`).

---

## 2. Data

### 2.1 `src/data/servers.ts` — Align Heat Node ke §6.1

Base heat disesuaikan ke tabel §6.1 (sebelumnya berbeda). Perubahan:

| Node | Sebelum | Sesudah (§6.1) |
|---|---|---|
| Web T1 | 10 | **8** |
| Web T2 | 20 | **14** |
| Web T3 | 35 | **24** |
| DB T1 | 15 | **6** |
| DB T2 | 30 | **12** |
| Cache T1 | 5 | **4** |
| Cache T2 | 12 | **8** |
| Router | 3 | **2** |
| Load Balancer | 4 | **3** |
| Firewall T1 | 5 | **3** |
| Firewall T2 | 10 | **6** |

`Storage` (heat 8) & `Rate Limiter` (heat 3) **tidak ada di tabel doc** → nilai tetap (tidak diubah). Cooling node tetap `heat: 0`.

### 2.2 `src/data/servers.ts` — Align Cooling Capacity ke §6.3

| Node | Sebelum | Sesudah (§6.3) | Deskripsi |
|---|---|---|---|
| Cooling Fan | +30 | **+15** | "menambah cooling capacity +15" |
| Industrial Fan | +60 | **+40** | "+40 (dan +10 ke rack tetangga di grid)" |
| Liquid Cooling | +100 | **+90** | "+90 cooling" |

> Harga & `monthlyCost` cooling node **tidak diubah** di Fase A (di luar ruang lingkup "heat & cooling capacity" yang disepakati). Bisa disesuaikan ke tabel §6.3 di Fase G jika diinginkan.

### 2.3 `src/data/products.ts` — Fitur Monetisasi Baru (data only)

Tambah definisi fitur (belum ada logic; cukup terdaftar supaya Fase B bisa membaca level fitur):

- **Social Media** → `ad_platform` (group `business`, `baseTraffic: 100`): "Ad Platform Interface" — driver tier Ads linear (§1).
- **Search Engine** → `ad_platform` (group `business`, `baseTraffic: 100`) + `b2b_search_api` (group `business`, `baseTraffic: 150`): "B2B Search API" (unlock penuh di fitur Lv.5, §2).
- **E-Commerce** → tidak dapat `ad_platform` (sesuai doc: hanya Social Media & Search Engine).

`requiredComponents` pakai komponen existing (`backend_code`, `network_module`) agar konsisten dengan fitur lain.

---

## 3. Store & Adjacency

### 3.1 `src/store/gameStore.ts` — State `activeMonetization`

Tipe baru (exported):

```ts
export type MonetizationStrategy =
  | 'none' | 'text_ads' | 'video_ads' | 'targeted_ads' | 'freemium' | 'subscription';
```

Tambah ke `GameState` dan initial state:

```ts
activeMonetization: MonetizationStrategy; // default 'none'
```

- Default `'none'` → perilaku sama persis dengan sistem lama (Ads flat $2/100 users).
- Dibaca Fase C (UI) & Fase B (logic) nanti.
- Model saat ini single-product (`selectedProduct`); disimpan sebagai 1 field. Jika suatu saat multi-product, ubah jadi `Record<productId, MonetizationStrategy>`.

### 3.2 `src/systems/server.ts` — Helper Adjacency

Fungsi baru `recomputeRackAdjacency(racks)` menghitung `adjacentRackIds` untuk tiap rack: rack di plot sama yang **berbagi sisi grid** (edge-touching, bukan sekadar sudut). Dipanggil di semua aksi perubahan posisi rack:

- `placeRack`, `moveRack`, `unplaceRack`, `unplaceAllRacks`, `autoPlaceRack` (di `gameStore.ts`) — hasil `set({ racks: recomputeRackAdjacency(...) })`)

Field ini dipakai Fase D untuk heat spread antar rack (§6.5).

---

## 4. Save/Load — Schema Version 12

### `src/db/gameDB.ts`

- Bump: `this.version(12).stores({ saves: '++id, timestamp' });` (sebelumnya v11).
- `GameSave` tambah `activeMonetization?: MonetizationStrategy;`.

### `src/systems/saveLoad.ts`

- `saveGame()`: tambah `activeMonetization: state.activeMonetization`.
- `loadGame()`: tambah `activeMonetization: save.activeMonetization ?? 'none'`.

Save lama (tanpa field) → `undefined` → fallback `'none'`, aman (tidak breaking).

---

## 5. Perubahan File

| File | Perubahan |
|---|---|
| `docs/update/update_v1.5.md` | **BARU** — dokumen ini |
| `src/types/server.ts` | `ServerRack`: tambah `heatRatio`, `adjacentRackIds` |
| `src/data/servers.ts` | Align `heat` node ke §6.1; align `capacity` cooling node ke §6.3 + deskripsi |
| `src/data/products.ts` | Tambah fitur `ad_platform` (Social Media, Search Engine) & `b2b_search_api` (Search Engine) |
| `src/store/gameStore.ts` | Tipe `MonetizationStrategy`; state `activeMonetization: 'none'`; inisialisasi di `buyRack` & `restartGame`; wire `recomputeRackAdjacency` ke 5 aksi rack |
| `src/systems/server.ts` | `recomputeRackAdjacency()` + helper `racksShareSide()` |
| `src/systems/saveLoad.ts` | Save/load `activeMonetization` |
| `src/db/gameDB.ts` | Dexie v12; `GameSave.activeMonetization?` |

---

## 6. Checklist

- [x] Type: `heatRatio` + `adjacentRackIds` di `ServerRack`
- [x] Data: align heat node ke tabel §6.1
- [x] Data: align cooling capacity ke tabel §6.3 (+update deskripsi)
- [x] Data: fitur `ad_platform` (Social Media & Search Engine)
- [x] Data: fitur `b2b_search_api` (Search Engine)
- [x] Store: tipe `MonetizationStrategy` + state `activeMonetization` (default `'none'`)
- [x] Store: inisialisasi field baru di `buyRack` & `restartGame`
- [x] Systems: `recomputeRackAdjacency` + wire ke `placeRack`/`moveRack`/`unplaceRack`/`unplaceAllRacks`/`autoPlaceRack`
- [x] Save/load: Dexie v12 + field `activeMonetization` (default `?? 'none'`)
- [x] Build sukses (`tsc -b` + `vite build`)
- [x] Lint: tidak ada error baru dari file yang diubah (2 error di `ServerRoomView.tsx` sudah ada sebelumnya, di luar scope Fase A)

---

## 7. Catatan Balancing & Lanjutan

- Perubahan angka heat/cooling di §2 menyentuh sistem overheat yang sudah jalan — sesuai persetujuan ("sesuaikan ke angka doc"). Validasi akhir (apakah rack tier rendah "sedikit overheat" & tier tinggi tidak otomatis kebal) dilakukan di **Fase D**.
- Logic yang belum ada (Fase B–G): rumus Ads tier linear, `calculateB2BRevenue()`, rebalance subscription, Freemium, override Data requirement saat Payment Gateway aktif, `calculateHeatRatio()` + Critical Overheat + heat spread aktual, UI Monetization Strategy & status rack 4-warna, SysAdmin tie-in, event Coolant Leak.
- **Belum diimplementasi di Fase A** (sesuai prinsip "build jalan & game tidak rusak"): tidak ada perubahan ke gameplay aktif — `activeMonetization: 'none'` berarti revenue tetap hitung seperti sistem lama.

---

## 8. Dev Mode (tetap)

Dev Panel & tombol `DEV` **tetap hanya di `npm run dev`** (`import.meta.env.DEV`).

---

## 9. Addendum — Server Capacity & Node Progression

Ditambahkan setelah Fase A (masih di rilis v1.5) untuk menutup bottleneck kapasitas Database yang muncul saat playtest, plus jalur progresi node yang hemat plot.

### 9.1 Rented DB Service

- `RentalType` tambah `'db'`; `RentedServer` tambah field `dbCapacity: number`.
- Definisi baru **DB Cluster**: `capacityRps: 0`, `storage: 200`, `monthlyCost: 200`, `uptime: 0.999`, `data: 4`, `dbCapacity: 800` (di `rentServer` & `scaleRental`, skalakan `dbCapacity` dengan `mult` yang sama).
- `calculateNodeLoads` → `totalDbCapacity` kini menjumlahkan `dbCapacity` dari rented server.
- `getDatabaseStatus(racks, effectiveRps, rentedServers?)` → kapasitas DB rented masuk ke `provided`.
- Save lama: `dbCapacity ?? 0` di `loadGame()` (tidak breaking).

### 9.2 Tier Node Baru (katalog)

| Node | Category | Capacity | Heat | Power | Price | $/mo |
|---|---|---|---|---|---|---|
| Web Server T4 | web_server | 1000 | 30 | 30 | 900 | 100 |
| Database T3 | database | 1000 | 20 | 30 | 700 | 90 |
| Caching T3 | caching | 1000 | 16 | 12 | 400 | 40 |

> Rencana "quality tier saat beli (Standard/Premium/Enterprise)" **di-drop** karena tumpang tindih dengan upgrade in-place (§9.3).

### 9.3 In-Place Node Upgrade (Perk End-Game)

Mekanik `scaleLevel` (1–5) yang sebelumnya **gratis** kini menjadi upgrade berbayar yang dikunci di balik perk mahal — reward end-game untuk menghemat plot (perkuat node tanpa beli hardware baru).

- **Perk baru** `hardware_overclock` (`src/data/perks.ts`), biaya **10 perk points**. `PerkDef.furnitureUnlock` dijadikan opsional; ikon `Gauge`.
- **Biaya upgrade** (`src/systems/server.ts`): `getUpgradeCost(node) = round(def.price × UPGRADE_COST_FACTOR[scaleLevel-1])`, `UPGRADE_COST_FACTOR = [0.5, 0.9, 1.5, 2.5]`; `null` saat sudah Lv.5.
- **Action** `upgradeNode(nodeId, delta)` menggantikan `setNodeScale`:
  - Gate: butuh `hardware_overclock` di `unlockedPerks`.
  - Upgrade (+1): potong cash sesuai `getUpgradeCost`, naik level (maks 5).
  - Downgrade (−1): turun level (min 1), **tanpa refund**.
  - Berlaku untuk node di rack **maupun** inventory (cari by `node.id`).
- **UI**: ikon panah **hijau ↑** (upgrade) / **merah ↓** (downgrade) ukuran mini, tooltip menampilkan harga/level tujuan; bila perk belum dibuka tampil label 🔒 "Overclock". Di `ServerPanel.tsx` (node rack) & `ServerRoomView.tsx` (dua daftar inventory, via `NodeUpgradeControls`).
- **Balance**: scaling gratis sebelumnya OP; kini jadi money-sink + gated. Penalti crash DB tidak diubah (5%/tick) — solusi bottleneck dilakukan lewat penambahan kapasitas (§9.1–9.2) & upgrade in-place.

### 9.4 Shop UI

`src/components/ServerShop.tsx` dipisah 3 section jelas: **Rent Server** (VPS/Dedicated/Cloud/DB Cluster) · **Buy Rack** · **Buy Node & Equipment**.

### 9.5 Perubahan File (Addendum)

| File | Perubahan |
|---|---|
| `src/types/server.ts` | `RentalType +'db'`; `RentedServer.dbCapacity`; `NodeTypeId` +`web_t4`/`db_t3`/`cache_t3` |
| `src/data/servers.ts` | 3 node tier baru |
| `src/data/perks.ts` | `furnitureUnlock` opsional; perk `hardware_overclock` (10 pt) |
| `src/components/PerksPanel.tsx` | ikon `Gauge`; teks tab unlock |
| `src/systems/server.ts` | `getUpgradeCost` + `UPGRADE_COST_FACTOR`; rented `dbCapacity` di `totalDbCapacity` & `getDatabaseStatus` |
| `src/store/gameStore.ts` | `rentServer`/`scaleRental` DB Cluster; `upgradeNode` (ganti `setNodeScale`) |
| `src/components/ServerPanel.tsx` | UI upgrade node (rack) + teruskan `rentedServers` ke `getDatabaseStatus` |
| `src/components/ServerRoomView.tsx` | `NodeUpgradeControls` di kedua daftar inventory |
| `src/components/ServerShop.tsx` | Restructure 3 section + DB Cluster |
| `src/systems/saveLoad.ts` | default `dbCapacity ?? 0` untuk rented lama |

### 9.6 Checklist Addendum

- [x] Rented DB Cluster (types, store, kapasitas, save-load)
- [x] Tier node baru web_t4 / db_t3 / cache_t3
- [x] Perk `hardware_overclock` (10 pt) + generalisasi `PerkDef`
- [x] `getUpgradeCost` + `upgradeNode` (berbayar, no-refund, gated, rack+inventory)
- [x] UI panah hijau/merah + tooltip + gate lock
- [x] Shop UI 3 section + DB Cluster
- [x] Build sukses; lint tanpa error baru (2 error `ServerRoomView` pre-existing)
