# Update V1.2 — Modern Flat UI Theme

**Induk:** `docs/update_v1.1.4.md` (Unequip node fix)
**Tujuan:** Mengganti tema retro-futurism (neon, scanline, glass) dengan **Modern Flat** — warna solid kontras tinggi, layout grid taktis, tipografi sans-serif profesional.

---

## 1. Filosofi: Dari "Retro Neon" ke "Modern Flat Corporate"

| Aspek | V1.1.x (Retro-Futurism) | V1.2 (Modern Flat) |
|---|---|---|
| **Mood** | Sci-fi neon, CRT scanline, deep midnight blue | Corporate dark, bersih, solid, profesional |
| **Background** | `#0A0E27` (midnight blue) | `#1A1D24` (abu-abu korporat gelap) |
| **Surface** | Transparan glass (`backdrop-filter`, `rgba`) | Solid tanpa blur (`#23272E`, `#2C3038`) |
| **Aksen** | Neon purple `#7C3AED`, cyan `#00FFFF`, orange `#F97316` | Fungsional: Steel blue `#2563EB`, Hijau `#22C55E`, Merah bata `#DC2626` |
| **Efek** | `neon-glow`, `scanlines`, glitch, `backdrop-filter` | Tidak ada efek dekoratif |
| **Sudut** | `rounded-xl` / `rounded-2xl` membulat | **Sharp corners** (sudut tegas, tanpa rounding) |
| **Border** | Border glow berwarna (`box-shadow` neon) | `border-2` solid, double border bersih |
| **Shadow** | Glow berwarna (`#7C3AED55`) | Flat shadow netral (`rgba(0,0,0,0.15-0.3)`) |
| **Font** | Space Grotesk + DM Sans | **Inter** (body) + **JetBrains Mono** (data) |

---

## 2. Color Palette Baru

| Token | Hex | Penggunaan |
|---|---|---|
| `--color-bg-base` | `#1A1D24` | Background utama |
| `--color-bg-surface` | `#23272E` | Surface panel, sidebar |
| `--color-bg-card` | `#2C3038` | Kartu, container |
| `--color-bg-hover` | `#343841` | Hover state |
| `--color-text-primary` | `#F0F0F0` | Teks utama (putih tajam) |
| `--color-text-secondary` | `#9CA3AF` | Teks sekunder |
| `--color-text-muted` | `#6B7280` | Label, placeholder |
| `--color-border` | `#3D4149` | Border standar |
| `--color-border-light` | `#4B4F59` | Border sekunder |
| `--color-primary` | `#2563EB` | Aksi utama, tombol |
| `--color-steel` | `#2563EB` | Informasi, tautan |
| `--color-profit` | `#22C55E` | Keuntungan, positif |
| `--color-danger` | `#DC2626` | Bahaya, negatif, error |

---

## 3. Perubahan Layout & Komponen

### Global
- Hapus kelas `scanlines`, `neon-glow`, `glass-card` dari semua komponen
- Semua `rounded-*` diubah menjadi sharp (tanpa rounding)
- `shadow` diganti dengan flat shadow tanpa warna neon
- Font: `font-['Space_Grotesk']` → `font-semibold` atau `font-mono` sesuai konteks

### Komponen Spesifik

| Komponen | Perubahan |
|---|---|
| `index.css` | Palette baru, hapus scanline/glow/glass, global scrollbar hidden |
| `index.html` | Font Inter + JetBrains Mono (ganti Space Grotesk + DM Sans) |
| `App.tsx` | Hapus `scanlines`, GameOver screen flat, Toast solid |
| `HudBar.tsx` | Background solid, aksen biru baja/hijau/merah, font mono untuk data |
| `Dock.tsx` | Border solid, indikator aktif berupa garis solid (bukan glow) |
| `FloatingPanel.tsx` | Flat `#23272E`, border-2 solid, header solid tanpa transparansi |
| `MainViewport.tsx` | Border-2 solid, tab aktif garis bawah solid |
| `OfficeGrid.tsx` | Border-2, status warna solid (bukan gradient) |
| `ServerPanel.tsx` | Kartu solid, border-2, indikator warna solid |
| `ServerShop.tsx` | Kartu border-2, warna aksen solid |
| `ServerRoomView.tsx` | Grid border solid, preview drag solid |
| `EmployeesPanel.tsx` | Kartu border-2, tombol solid |
| `FeaturesPanel.tsx` | Kartu border-2, status solid |
| `FinancePanel.tsx` | Warna profit/danger solid |
| `LandMap.tsx` | Border-2, indikator solid |
| `CharacterAvatar.tsx` | Warna disesuaikan, hapus drop-shadow |
| `DevPanel.tsx` | Flat styling mengikuti theme baru |

---

## 4. Scrollbar

- Seluruh scrollbar di-**hidden** secara global (`*::-webkit-scrollbar { width: 0; height: 0; }`)
- Scrollbar tetap fungsional (bisa scroll via trackpad/mouse wheel/touch)
- Tidak perlu lagi menambahkan class `custom-scroll` secara manual

---

## 5. Font

| Penggunaan | Font | Alasan |
|---|---|---|
| Body / Navigasi | **Inter** | Sans-serif bersih, profesional, readability tinggi |
| Data / Angka | **JetBrains Mono** | Monospasi fungsional, cocok untuk tabel & stat |
| Heading | **Inter** (semibold/bold) | Konsisten dengan body, weight membedakan hierarki |

Import Google Fonts:
```
https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap
```

---

## 6. Checklist Pre-Delivery

- [x] Semua efek neon/scanline/glass dihapus
- [x] Sharp corners di semua komponen (tanpa `rounded-*`)
- [x] Warna solid kontras tinggi (≥4.5:1)
- [x] Aksen fungsional: hijau (profit), merah bata (danger), biru baja (info)
- [x] Font Inter + JetBrains Mono terpasang
- [x] Global scrollbar hidden
- [x] `border-2` double border konsisten
- [x] Layout grid taktis tanpa tumpukan berantakan
- [x] Build production sukses (`npm run build`)

---

## 7. Dev Mode (tetap)

Dev Panel & tombol `DEV` **tetap hanya di `npm run dev`** (`import.meta.env.DEV`) — tidak di production.
