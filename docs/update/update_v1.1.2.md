# Update V1.1.2 — Window Manager, Day Cycle, Server Shop, Land & VPS Rental

**Induk:** `docs/update_v1.1.md` (Command Center) · lanjutan `docs/update_v1.1.1.md` (responsive/mobile)
**Berdasarkan:** UI/UX Pro Max Skill (shop/catalog UX + draggable panel best-practice) & design system `design-system/tech-startup-simulator/MASTER.md`
**Tujuan:** (1) panel jadi **window yang bisa dipindah & diminimize** dengan ukuran default responsif, (2) ubah **Tick → Day (1–30)**, (3) beli server jadi **Shop** berisi item (rack/router/dll), (4) ada **peta/lahan (plot)** untuk menaruh rack milik sendiri, (5) fitur **sewa server eksternal** (VPS/Dedicated/Cloud).

> Palette & font **tetap** dari V1.0/1.1.1: Primary `#7C3AED`, CTA `#F97316`, font Space Grotesk + DM Sans, glass card, ikon Lucide, responsif mobile (bottom sheet).

---

## 1. Window Manager — Panel Terbuka (Draggable & Minimizable)

Panel tidak lagi numpuk di kolom kanan, melainkan **terbuka sebagai jendela melayang di atas Main Viewport** (scene kantor/"meja"). Mirip window manager game/OS.

### Perilaku
- **Buka**: klik ikon di Dock → panel muncul sebagai floating window di atas office floor.
- **Pindah (move)**: klik & seret pada **header** panel (`onPointerDown` → update `x/y`). Kursor `cursor-grab` / `grabbing`.
- **Minimize**: tombol `_` → window disembunyikan, muncul sebagai **task item** di taskbar bawah; klik task item → restore.
- **Close**: tombol `X` → `togglePanel(id)` (tutup).
- **Z-index**: klik window → naik ke depan (`z-30` scale). Pakai skala `z-10/20/30/40` (anti arbitrary `z-[9999]`).
- **Default size responsif**: lebar pakai `clamp(320px, 32vw, 420px)`, tinggi `clamp(280px, 60vh, 70vh)` → **tidak pernah kepotong** di layar manapun.
- **Posisi default**: menata bertingkat (kaskade) dari kiri-atas viewport agar tidak tumpang tumpuk semua.

### Taskbar (pengganti/extensi Dock bawah)
- Di bawah Dock, ada **taskbar** berisi chip tiap panel yang sedang terbuka/minimize.
- Mobile: window jadi **full-screen bottom sheet** (warisan V1.1.1), drag dinonaktifkan.

### Komponen
| File | Perubahan |
|---|---|
| `FloatingPanel.tsx` | Tambah drag (state `pos {x,y}`), minimize→taskbar, default size `clamp()`, `z-index` focus, `cursor-grab` di header. Mobile: `fixed bottom sheet` (sudah ada). |
| `PanelTaskbar.tsx` | **BARU** — daftar panel terbuka/minimize (restore/klik). |
| `Dock.tsx` | Panggil `togglePanel`; panel kini floating (bukan kolom). |
| `App.tsx` | Render FloatingPanel di atas `<MainViewport>` (absolute layer), + `<PanelTaskbar>`. |

---

## 2. Day Cycle — Tick → Day (1–30)

Ubah satuan waktu dari "Tick" menjadi **Day**. 30 hari = 1 bulan (konsisten dengan `TICKS_PER_MONTH = 30`).

### Aturan
- `tick` internal tetap sebagai counter; **tampilan** = `Day = (tick % 30) + 1`.
- Saat `Day` mencapai 30 → `month + 1`, payroll & billing server jalan (logic `incrementTick` tetap).
- **Durasi per hari** mengikuti speed: `1x = 2.0s/hari`, `2x = 1.0s`, `4x = 0.5s` (atur di game loop interval).
- HUD: `DAY 12 / 30` (bukan `Tick 350/30`). Speed controls (Pause/1x/2x/4x) tetap.

### Komponen
| File | Perubahan |
|---|---|
| `HudBar.tsx` | Stat `TICK` → `DAY x/30`; label `MONTH` tetap. |
| `gameStore.ts` | Helper `getDay()` = `(tick % 30) + 1`; tidak wajib ubah logic, hanya display. Boleh rename field `tick` jadi `dayCounter` (opsional). |
| `OfficeGrid.tsx`, `ServerPanel.tsx`, dll | Ganti teks "Tick" → "Day" jika muncul. |

---

## 3. Server Shop — Katalog Item

UI beli server dirombak jadi **Shop** (katalog kartu) menggantikan tombol inline di `ServerPanel`.

### Kategori & Item (sumber: `src/data/servers.ts`)
| Kategori | Item |
|---|---|
| **Racks** | Basic Rack, Advanced Rack, Enterprise Rack |
| **Compute** | Web Server T1/T2/T3 |
| **Database** | Database T1/T2 |
| **Caching** | Caching T1/T2 |
| **Networking** | Router |
| **Cooling** | Cooling Fan, Industrial Fan |
| **Storage** | Storage Node |
| **Cloud / Rental** | VPS, Dedicated, Cloud (lihat §5) |

### Tampilan tiap kartu
- Ikon Lucide (`Server`, `Cpu`, `Database`, `Zap`, `Router`, `Snowflake`, `HardDrive`, `Cloud`).
- Nama, **harga beli**, **biaya/bulan**, spesifikasi singkat (kapasitas/heat/power).
- Tombol **Buy** (rack → butuh plot kosong, lihat §4; node → taruh di rack terpilih/pertama kosong).
- Grid kartu responsif `grid-cols-2 md:grid-cols-3`.

### Komponen
| File | Perubahan |
|---|---|
| `ServerShop.tsx` | **BARU** — katalog shop (kategori + kartu). Menggunakan `buyRack`, `buyNode`, `rentServer` (§5), `buyPlot` (§4). |
| `ServerPanel.tsx` | Sekarang fokus **manajemen** (rack/node milik sendiri + sewaan), tombol beli dialihkan ke `ServerShop`. |

---

## 4. Land / Plot Map — Lahan Data Center Milik Sendiri

Tambah konsep **Plot/Lahan** yang dibeli, lalu di atasnya diletakkan rack milik sendiri.

### Model
- `plots: Plot[]` — tiap plot = lahan dengan `id`, `label` (mis. "Plot A"), `price`, `racks: ServerRack[]`.
- Beli plot dulu (`buyPlot`) → muncul di peta. Lalu `buyRack(tier, plotId)` menaruh rack di plot tersebut.
- Node ditaruh ke slot rack seperti biasa.

### Tampilan "Map/Lahan"
- **Tabel/Grid plot**: tiap baris/kotak = 1 plot; menampilkan rack di dalamnya + total kapasitas/heat.
- Klik plot → detail rack (mirip `RackCard`).
- Ada tombol **Buy Plot** (harga mis. $1.500, biaya $50/bln).
- Empty state: "No land yet — buy a plot to build your data center."

### Komponen
| File | Perubahan |
|---|---|
| `types/server.ts` | Tambah `Plot`. |
| `gameStore.ts` | `plots: Plot[]`, `buyPlot()`, `buyRack(tier, plotId)` (override), `sellPlot()`. |
| `LandMap.tsx` (atau `DataCenterView.tsx`) | **BARU** — grid/table plot + tombol beli plot + manajemen rack per plot. |
| `ServerPanel.tsx` | Tampilkan `LandMap` (owned racks) + sewaan (§5). |

---

## 5. Sewa Server Eksternal — VPS / Dedicated / Cloud

Fitur baru: **sewa kapasitas dari provider luar** tanpa membangun rack/land sendiri.

### Opsi Rental
| Tipe | Kapasitas RPS | Storage | Harga/bulan | Catatan |
|---|---|---|---|---|
| **VPS** | 150 RPS | 50 | $40 | Murah, scale kecil, SLA 99% |
| **Dedicated** | 600 RPS | 200 | $180 | Tinggi, kontrol penuh, SLA 99.9% |
| **Cloud** | 1000 RPS (elastic) | 500 | $300 + usage | Auto-scale, SLA 99.95% |

### Mekanik
- Disimpan di `rentedServers: RentedServer[]` (terpisah dari `racks`).
- **Tidak ada** mekanik overheat/cooling/crash (provider yang tangani) → mengurangi mikromanajemen.
- Trade-off: biaya bulanan lebih tinggi & tidak bisa pasang node sendiri; namun **tidak bisa bangkrut karena crash server**.
- Ada risiko kecil **provider outage** (mis. 1% per bulan) → sementara RPS sewaan hilang (uptime penalty), seperti crash tapi otomatis recover.
- Traffic didistribusikan ke **total kapasitas** = owned racks + rented servers.
- Billing: `monthlyBilling` tambah `sum(sewaan.monthlyCost)`.

### Komponen
| File | Perubahan |
|---|---|
| `types/server.ts` | Tambah `RentedServer`, `RentalType`. |
| `gameStore.ts` | `rentedServers`, `rentServer(type)`, `cancelRental(id)`. |
| `systems/server.ts` | `calcMonthlyServerCost` & `calculateNodeLoads` ikut menyertakan kapasitas sewaan. |
| `ServerShop.tsx` | Kategori "Cloud / Rental" → `rentServer`. |
| `ServerPanel.tsx` | Section "Rented (External)" menampilkan sewaan + tombol cancel. |

---

## 6. Ringkasan Perubahan Store/Types

```ts
// types/server.ts (tambahan)
export interface Plot { id: string; label: string; price: number; monthlyCost: number; racks: ServerRack[]; }
export type RentalType = 'vps' | 'dedicated' | 'cloud';
export interface RentedServer { id: string; type: RentalType; capacityRps: number; storage: number; monthlyCost: number; uptime: number; }

// gameStore (tambahan)
plots: Plot[];
rentedServers: RentedServer[];
buyPlot: () => void;
buyRack: (tier: RackTier, plotId: string) => void;   // override: wajib plotId
rentServer: (type: RentalType) => void;
cancelRental: (id: string) => void;
```

---

## 7. Komponen yang Diubah (rencana implementasi)

| File | Perubahan |
|---|---|
| `FloatingPanel.tsx` | Drag + minimize-to-taskbar + default size `clamp()` + z-focus |
| `PanelTaskbar.tsx` | BARU — task item panel terbuka/minimize |
| `HudBar.tsx` | `DAY x/30` (ganti Tick) |
| `Dock.tsx` | Buka panel sebagai floating window |
| `App.tsx` | Layer floating panel di atas MainViewport + PanelTaskbar |
| `ServerShop.tsx` | BARU — katalog shop (racks/nodes/cooling + rental) |
| `LandMap.tsx` / `DataCenterView.tsx` | BARU — peta plot/lahan |
| `ServerPanel.tsx` | Manajemen: LandMap + Rented section; beli dialihkan ke Shop |
| `types/server.ts` | `Plot`, `RentedServer`, `RentalType` |
| `gameStore.ts` | `plots`, `rentedServers`, day helper, aksi terkait |
| `systems/server.ts` | Hitung kapasitas & biaya termasuk sewaan |

---

## 8. Checklis Pre-Delivery (UI/UX Pro Max)
- [x] No emoji sebagai ikon (Lucide SVG)
- [x] `cursor-pointer` / `cursor-grab` di elemen interaktif & header drag
- [x] Hover/active smooth 150–250ms, tanpa layout shift
- [x] Kontras teks ≥4.5:1
- [x] Focus state visible (keyboard)
- [x] `prefers-reduced-motion` dihormati
- [x] Responsif 375/768/1024/1440 — panel mobile = full sheet, default size `clamp()` tidak kepotong
- [x] Touch target ≥44px (tombol Shop, drag di mobile nonaktif)
- [x] Z-index pakai skala 10/20/30/40

---

## 9. Dev Mode (tetap)
Dev Panel & tombol `DEV` **tetap hanya di `npm run dev`** (`import.meta.env.DEV`) — tidak di production.
