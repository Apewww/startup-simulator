# Update V1.2 — Corporate Dashboard Light Theme + Floating Panel Management

**Induk:** `docs/update_v1.1.4.md` (Unequip node fix)
**Tujuan:** Migrasi dari dark corporate ke **light corporate dashboard** (referensi mockup) + perbaikan sistem panel (posisi, maximize, stacking).

---

## 1. Theme: Dark → Light Corporate

| Aspek | Sebelum | Sesudah |
|---|---|---|
| **Mode** | Dark (`#1A1D24`) | **Light** (`#F4F6F9`) |
| **Surface** | `#23272E` (gelap) | **Putih** `#FFFFFF` + `#F8F9FB` |
| **Text** | `#F0F0F0` | **Dark navy** `#1A2233` + `#667085` |
| **Primary** | `#2563EB` (steel blue) | **Indigo** `#4F5EFF` |
| **Border** | `#3D4149` | `#E3E7EE` (light gray) |
| **Radius** | Sharp (0) | `10px` (card), `8px`/`12px` (panel) |
| **Shadow** | Flat dark | `0 12px 32px -8px rgba(20,30,60,0.15)` |
| **Font mono** | JetBrains Mono | **IBM Plex Mono** |
| **Font body** | Inter | Inter (font-weight 800 added) |

### Color Palette

| Token | Hex | Penggunaan |
|---|---|---|
| `--color-bg` | `#F4F6F9` | Background utama |
| `--color-surface` | `#FFFFFF` | Kartu, panel, surface |
| `--color-surface-2` | `#F8F9FB` | Secondary surface, hover |
| `--color-border` | `#E3E7EE` | Semua border |
| `--color-ink` | `#1A2233` | Teks utama |
| `--color-ink-soft` | `#667085` | Teks sekunder |
| `--color-indigo` | `#4F5EFF` | Aksi utama, tombol |
| `--color-indigo-soft` | `#EEF0FF` | Active state |
| `--color-green` | `#17A366` | Profit/positif |
| `--color-green-soft` | `#E8F8F0` | Badge profit |
| `--color-amber` | `#B7791F` | Warning |
| `--color-amber-soft` | `#FBF1DE` | Badge warning |
| `--color-red` | `#D1453B` | Danger/negatif |
| `--color-red-soft` | `#FDECEC` | Badge danger |

---

## 2. Perubahan Layout

### HudBar
- Tinggi tetap `h-[52px]`
- Speed control: **pill group** (`bg-surface-2`, `border`, `rounded-lg`, `p-[3px]`)
- Logo: dot indigo + "STARTUP SIM"
- Tombol Simpan: `bg-ink text-white`
- Stat format: `Bulan / Hari` → `M3 · D14/30`

### Dock
- Width: `64px` (sebelumnya flexible)
- Item: `w-11 h-11 rounded-[10px]`, icon-only (tanpa label)
- Active: `bg-indigo-soft text-indigo`

### Taskbar
- Chip style: active = `bg-indigo-soft text-indigo border-transparent`, inactive = `bg-surface-2 border-border`

### Office Grid
- Desk worker: `bg-green-soft border-green` (working), `bg-red-soft border-red` (low happiness)
- Avatar: kotak `22px` solid, idle = opacity 0.55
- Empty desk: `border-dashed border-border`

### Floating Panel
- Background: putih solid (`#FFFFFF`)
- Header: `bg-surface-2` (`#F8F9FB`)
- Shadow: `0 12px 32px -8px rgba(20,30,60,0.15)`
- Border: `1px solid #E3E7EE`
- Border-radius: `12px`

### Cards & Containers
- `card`: `bg-surface`, `border border-border`, `rounded-[10px]`
- `card-hover`: sama + hover → `bg-surface-2`, `border-indigo`

---

## 3. Floating Panel Positioning

### Default Position (non-maximized)
- **Random** position dalam main viewport: `x: 80px`–`window.innerWidth-420`, `y: 80px`–`window.innerHeight-300`
- Dihitung sekali via `useRef` agar tidak berubah tiap re-render
- Panel bisa di-drag bebas

### Maximized (Full Size)
- Posisi: **right sidebar** — `fixed right-0 top-[52px] bottom-10 w-[420px]`
- Tidak memenuhi layar penuh, dibatasi antara HUD bar (52px) dan taskbar (40px)
- Drag dinonaktifkan saat maximize
- Border-radius: `rounded-l-xl` (kiri saja)

### Maximize Logic
- **Hanya 1 panel** yang bisa maximized dalam satu waktu
- State `maximizedPanel: PanelId | null` di gameStore
- Saat panel A di-maximize:
  - Jika panel B sebelumnya maximized → **B auto-minimize**
  - A menjadi maximized
- Saat panel A di-unmaximize:
  - Posisi kembali ke **right side** (`window.innerWidth - 340`)
  - `maximizedPanel` = null
- Panel yang di-minimize tapi di-maximize akan muncul kembali

### Minimize
- Panel minimized tetap track di store (`panelMinimized`)
- Tapi jika panel sedang maximized, ia tetap visible meskipun `panelMinimized[id] = true`
- Filter render: `if (!open || (minimized && !isMaximized)) return null`

---

## 4. File yang Diubah

| File | Perubahan |
|---|---|
| `index.css` | Palette light, hapus dark tokens, tambah `card`/`card-hover`, shadow panel |
| `index.html` | Font Inter + IBM Plex Mono (ganti JetBrains Mono) |
| `App.tsx` | Light bg, GameOver light, Toast light |
| `HudBar.tsx` | Height 52px, speed pill group, stat format baru |
| `Dock.tsx` | 64px width, icon-only, active indigo-soft |
| `FloatingPanel.tsx` | Posisi random, maximize jadi right sidebar, drag nonaktif saat max |
| `MainViewport.tsx` | Tab indigo, layout light |
| `PanelTaskbar.tsx` | Chip style light |
| `OfficeGrid.tsx` | Desk status dengan soft bg, avatar kotak |
| `ServerPanel.tsx` | Light card, border, badge |
| `ServerShop.tsx` | Light card, indigo accent |
| `LandMap.tsx` | Light card, compact layout |
| `ServerRoomView.tsx` | Light theme, indigo border |
| `EmployeesPanel.tsx` | Badge happiness soft bg, border-b |
| `FeaturesPanel.tsx` | Badge light, indigo button |
| `FinancePanel.tsx` | Green/red text, border separator |
| `MainMenu.tsx` | Light card-hover |
| `ProductSelect.tsx` | Light card-hover |
| `CharacterAvatar.tsx` | Warna indigo/green/pink |
| `DevPanel.tsx` | Light surface |
| `gameStore.ts` | Tambah `maximizedPanel`, `setMaximizedPanel`, auto-minimize logic |

---

## 5. Bug Fixes & Refinements

### Un-maximize Panel Hilang (Bug)
- **Root cause:** `setMaximizedPanel(null)` di `handleMaximize` memicu auto-minimize karena `state.maximizedPanel !== null`.
- **Fix v1:** Guard `id &&` ditambahkan di `setMaximizedPanel` — gagal karena `isMaximized` stale closure.
- **Fix v2 (final):** `handleMaximize` refactored menggunakan `useGameStore.getState()` langsung (bukan closure `isMaximized`) dan `useGameStore.setState()` atomik untuk menghindari race condition antara `toggleMinimize` dan `setMaximizedPanel`.

### Panel Overlap dengan Maximized Sidebar
- **Masalah:** Panel non-maximized bisa muncul di area yang sama dengan maximized panel (right sidebar).
- **Fix:** `useEffect` pada `FloatingPanel.tsx` mendeteksi jika `pos.x >= window.innerWidth - 440` saat ada maximized panel, lalu memindahkan panel ke kiri secara random.

### Panel Lahir di Left Side
- Saat tombol maximize diklik (menjadi full right sidebar), panel non-maximized lain yang overlap di area kanan otomatis pindah ke random left position.

---

## 6. Checklist

- [x] Light corporate theme (bg `#F4F6F9`, surface white)
- [x] Panel default position random dalam viewport
- [x] Maximized = right sidebar (`top-[52px] bottom-10 w-[420px]`)
- [x] Hanya 1 panel maximized per waktu (auto-minimize previous)
- [x] Un-maximize snap ke right side
- [x] Scrollbar hidden global
- [x] Font Inter + IBM Plex Mono
- [x] Build production sukses

---

## 7. Dev Mode (tetap)

Dev Panel & tombol `DEV` **tetap hanya di `npm run dev`** (`import.meta.env.DEV`).
