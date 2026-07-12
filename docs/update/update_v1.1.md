# Update V1.1 — Game-like UI Overhaul

**Berdasarkan:** UI/UX Pro Max Skill — Design System "Retro-Futurism" + "HUD / Sci-Fi FUI"
**Tujuan:** Mengubah UI dari dashboard datar menjadi antarmuka yang terasa seperti game: ada main panel (viewport) dan panel-panel yang bisa di-popup / di-hide.

---

## 1. Design System (dari UI/UX Pro Max)

### Style Direction
Perpaduan **Retro-Futurism** (neon purple/orange, CRT scanlines, glitch) dengan **HUD / Sci-Fi FUI** (thin 1px lines, bracket markers, transparent panels, monospaced tech font). Hasil: layar yang terasa seperti command center game tycoon.

### Colors
| Role | Hex | Penggunaan |
|---|---|---|
| Primary | `#7C3AED` | Aksen utama, border panel, tombol aktif |
| Secondary | `#A78BFA` | Teks heading, hover state |
| CTA / Action | `#F97316` | Tombol aksi utama, notifikasi penting |
| HUD Cyan | `#00FFFF` | Marker teknis, progress bar, indicator online |
| Alert Red | `#FF0000` | Overheat, bankrupt, warning |
| BG Base | `#0A0E27` | Background utama (deep midnight blue) |
| Panel BG | `rgba(10,14,39,0.85)` | Panel transparan (glass/HUD) |

### Typography
- **Heading / HUD**: `Share Tech Mono` (monospaced sci-fi) — ganti Fira Code di heading
- **Body**: `Fira Code` (data/teks)
- Import: `https://fonts.googleapis.com/css2?family=Fira+Code:wght@300;400;500;600;700&family=Share+Tech+Mono&display=swap`

### Effects
- CRT scanlines (`::before` overlay) — sudah ada di `.scanlines`
- Neon glow (`text-shadow` + `box-shadow`)
- Decorative corner brackets `[ ]` di tiap panel (HUD style)
- Glitch halus saat transisi panel terbuka
- Transisi 150–300ms, `prefers-reduced-motion` dihormati

---

## 2. Layout Baru — "Command Center"

```
┌──────────────────────────────────────────────────────────────────┐
│  TOP HUD BAR: 💰 Cash | 👥 Users | ⚡ RPS | 📅 Month | ⏸ 1x 2x 4x  │  ← stat bar selalu visible
├──────┬───────────────────────────────────────────────┬───────────┤
│ DOCK │                                               │  FLOATING  │
│ (kiri│         MAIN PANEL / VIEWPORT                 │  PANELS    │
│ side)│     (Office grid / server room / overview)    │ (pop-up,   │
│      │                                               │  bisa hide)│
│ [Emp]│                                               │            │
│ [Feat│                                               │  ┌─────┐   │
│ [Srv]│                                               │  │ ### │   │
│ [Fin]│                                               │  │ ### │   │
│ [Off]│                                               │  └─────┘   │
└──────┴───────────────────────────────────────────────┴───────────┘
```

### A. Top HUD Bar (selalu terlihat)
- Stat kritis: Cash, Users, RPS, Uptime, Month, Speed controls (Pause/1x/2x/4x).
- Gaya HUD: thin border bawah, teks `Share Tech Mono`, angka dengan neon glow.
- Indikator warning (cash negatif / overheat) berkedip merah (`animate-pulse`).

### B. Dock (kiri / bawah)
- Baris tombol ikon untuk toggle setiap panel.
- Ikon Lucide (sudah terinstall):
  - Employees → `Users`
  - Features → `LayoutGrid` / `Boxes`
  - Server → `Server` / `Cpu`
  - Finance → `DollarSign` / `LineChart`
  - Office → `Monitor` / `Building2`
- Tombol aktif: glow purple + border. Panel terbuka = tombol "nyala".
- Shortcut keyboard `1`–`5` untuk toggle panel.

### C. Main Panel / Viewport (tengah)
- Area utama yang selalu terlihat — "layar game".
- Berisi scene aktif (default: Office Grid / Server Room).
- Bisa diganti via tab kecil di dalamnya (Overview / Office / Server Room).

### D. Floating Panels (popup & hide)
Setiap panel adalah **window HUD terapung** yang bisa:
- **Buka / Tutup** via dock atau shortcut
- **Minimize** (ciut ke dock)
- **Maximize** (fullscreen overlay)
- **Drag** (opsional, kalau waktu cukup) atau posisi tetap (right-side stack)
- Header panel: nama + tombol `Minimize` / `Maximize` / `X` (pakai ikon `Minus` / `Maximize2` / `X` dari Lucide)
- Sudut panel pakai corner bracket HUD (`::before`/`::after` atau border accent)

---

## 3. Asset & Ikon

### Ikon UI (Lucide — sudah ada di `package.json`)
Panel toggle & kontrol pakai Lucide (no emoji). Referensi dari `data/icons.csv`:
| Fungsi | Ikon Lucide |
|---|---|
| Employees | `Users`, `UserPlus` |
| Features | `LayoutGrid`, `Boxes` |
| Server | `Server`, `Cpu`, `Database` |
| Finance | `DollarSign`, `LineChart` |
| Office | `Monitor`, `Building2` |
| Speed/Pause | `Play`, `Pause` |
| Panel control | `Minus`, `Maximize2`, `X`, `Sidebar` |
| Save/Load | `Save`, `FolderOpen` |

### Karakter & Asset Visual (gambaran orang / server / ruangan)
Untuk membuat "terasa game", representasi karakter & objek tidak lagi pakai teks simbol. Opsi asset:

1. **Role Avatar (SVG inline / Lucide)** — sudah dipakai: Developer=`Code`, Designer=`PenTool`, Lead=`Star`, SysAdmin=`Wrench`. Bisa ditingkatkan jadi **avatar berwarna per role** dengan lingkaran neon + inisial.
2. **Sprite karakter (free asset pack)** — untuk V1.1 visual yang lebih "game", sumber asset gratis & offline-friendly:
   - **Kenney.nl** — "Character" / "Toon Characters" / "Pixel Characters" pack (CC0, gratis, bisa di-recolor per role).
   - **OpenGameArt.org** — "Animated Character" packs (dungeon/office themed).
   - Simpan sebagai SVG/PNG di `src/assets/characters/` dan render di Office Grid.
3. **Server / Rack asset** — ikon `Server`/`Cpu` Lucide cukup untuk node; atau pakai sprite rack dari Kenney "Computer" pack untuk tampilan server room.
4. **Office furniture** — `Monitor`, `Armchair`, `Sofa` (Lucide) untuk meja/kursi; atau sprite dari Kenney "Office" pack.

**Rekomendasi V1.1:** Gunakan **Kenney CC0 character pack** (recolor per 4 role) untuk Office Grid + ikon Lucide untuk semua kontrol panel. Asset offline (tidak perlu fetch internet saat runtime).

---

## 4. Komponen Baru / Diubah

| File | Perubahan |
|---|---|
| `src/store/gameStore.ts` | Tambah `openPanels: Record<PanelId, boolean>`, `togglePanel(id)`, `activeView` (overview/office/server) |
| `src/components/Dock.tsx` | **BARU** — dock kiri dengan tombol toggle panel + shortcut keyboard |
| `src/components/HudBar.tsx` | **BARU** — top stat bar (cash/users/rps/month/speed) |
| `src/components/FloatingPanel.tsx` | **BARU** — wrapper window HUD (header + minimize/maximize/close + corner brackets) |
| `src/components/EmployeesPanel.tsx` | Dibungkus `FloatingPanel` (dari inline di App.tsx) |
| `src/components/FeaturesPanel.tsx` | Dibungkus `FloatingPanel` (dari inline di App.tsx) |
| `src/components/ServerPanel.tsx` | Dibungkus `FloatingPanel`, posisi right-side |
| `src/components/FinancePanel.tsx` | **BARU** — cash flow breakdown (dari inline App.tsx) |
| `src/components/OfficeGrid.tsx` | Pakai sprite karakter (Kenney) + avatar neon per role |
| `src/components/MainViewport.tsx` | **BARU** — area tengah dengan tab (Overview/Office/Server) |
| `src/App.tsx` | Susun layout: HudBar + Dock + MainViewport + FloatingPanels; hapus grid datar lama |

---

## 5. Checklis Pre-Delivery (UI/UX Pro Max)
- [x] No emoji sebagai ikon (Lucide SVG)
- [x] `cursor-pointer` di semua elemen interaktif (tombol dock, header panel)
- [x] Hover state smooth 150–300ms
- [x] Kontras teks min 4.5:1 (HUD cyan/white di dark)
- [x] Focus state visible (keyboard nav panel)
- [x] `prefers-reduced-motion` dihormati
- [x] Responsive: 375 / 768 / 1024 / 1440 (dock jadi bottom bar di mobile)
- [x] Panel bisa hide/popup (reduce clutter)

---

## 6. Dev Mode (tetap berlaku dari V1.0)
Dev Panel & tombol `DEV` **tetap hanya muncul di `npm run dev`** (`import.meta.env.DEV`), tidak di production build.

---

## 7. Cara Kerja (alur)
1. Buka game → ProductSelect (V1.0 style).
2. Masuk ke Command Center: HUD bar atas + Dock kiri + Main Viewport tengah.
3. Klik ikon di Dock (atau tekan `1`–`5`) → panel pop-up di sisi kanan.
4. Panel bisa di-minimize (kembali ke dock) atau di-close (hide).
5. Main viewport menampilkan scene aktif (office / server room) dengan sprite karakter.
6. Stat di HUD bar update real-time dari Zustand store.
