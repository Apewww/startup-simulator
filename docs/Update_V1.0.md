# Update V1.0 — Tech Startup Simulator

## Pembaruan UI (Berdasarkan UI/UX Pro Max Skill)

### Design System yang Telah Diterapkan

Studio desain **UI/UX Pro Max** telah digunakan untuk merancang sistem desain lengkap yang dipersist di `design-system/tech-startup-simulator/MASTER.md`.

| Aspek | Sebelum (Prototype) | Sesudah (V1.0) |
|---|---|---|
| **Tema** | Dark gray-scale (`bg-gray-900`, `text-gray-100`) | Retro-Futurism — neon purple/orange, deep black, synthwave aesthetic |
| **Warna** | Hanya gray Tailwind + warna status (green/red/yellow) | Primary `#7C3AED`, CTA `#F97316`, Background `#FAF5FF`, Text `#4C1D95` |
| **Tipografi** | System default sans-serif | **Fira Code** (heading) + **Fira Sans** (body) — Google Fonts sudah di-import |
| **Ikon** | Emoji (🌐 🛒 🔍 </> ◎ ★ ⚙) | SVG icons (Lucide/Heroicons) — semua emoji ikon diganti |
| **Efek** | Tidak ada (flat) | Neon glow (`text-shadow` + `box-shadow`), CRT scanlines, glitch effects, transisi 150-300ms |
| **Kartu/Komponen** | Border `border-gray-700` | Shadow depth system (`--shadow-sm` hingga `--shadow-xl`), border berwarna neon |

### Checklist Pre-Delivery (Sudah Dipenuhi)

- [x] Semua emoji ikon diganti dengan SVG (Lucide/Heroicons)
- [x] `cursor-pointer` pada semua elemen yang dapat diklik
- [x] Hover states dengan smooth transitions (150-300ms)
- [x] Kontras teks minimum 4.5:1 di light mode
- [x] Focus states visible untuk keyboard navigation
- [x] `prefers-reduced-motion` dihormati
- [x] Responsive di 375px, 768px, 1024px, 1440px

### Komponen yang Diperbarui

| Komponen | Perubahan |
|---|---|
| `App.tsx` (dashboard utama) | Layout grid diperhalus, warna diubah sesuai palette baru, font diterapkan |
| `ProductSelect.tsx` | Ikon produk dari emoji jadi SVG, kartu produk dengan efek glow & shadow |
| `ServerPanel.tsx` | Load bar dengan warna neon, indikator overheat dengan animasi glitch, ikon rack/node pakai SVG |
| `OfficeGrid.tsx` | Meja karyawan dengan border glow sesuai status, tooltip dengan desain baru |
| `DevPanel.tsx` | **Hanya muncul di dev mode** (lihat catatan di bawah) |
| `GameOverScreen` | Layar game over dengan efek CRT scanline, tombol restart neon |

### CSS Custom Properties yang Ditambahkan (`src/index.css`)

```css
@theme {
  --color-primary: #7C3AED;
  --color-secondary: #A78BFA;
  --color-cta: #F97316;
  --color-background: #FAF5FF;
  --color-text: #4C1D95;
  --font-heading: 'Fira Code', monospace;
  --font-body: 'Fira Sans', sans-serif;
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.1);
  --shadow-lg: 0 10px 15px rgba(0,0,0,0.1);
  --shadow-xl: 0 20px 25px rgba(0,0,0,0.15);
}
```

---

## Dev Mode — Hanya untuk Testing (Bukan Production)

**Dev Panel (`DevPanel.tsx`)** adalah tools debugging yang memberikan akses instan ke:
- Manipulasi saldo cash
- Rekrut karyawan instan (role apa pun)
- Instant complete task
- Tambah resource/komponen
- Unlock all features
- Beli rack & node gratis
- Fast-forward ticks

### Kebijakan V1.0

| Lingkungan | Dev Panel | Keterangan |
|---|---|---|
| `npm run dev` (local dev) | ✅ Tersedia | Untuk testing & debugging |
| `npm run build` (production) | ❌ Tidak tersedia | Dicabut dari production bundle |

### Implementasi

Dev Panel diproteksi dengan environment check:

```ts
// DevPanel.tsx
const isDev = import.meta.env.DEV; // Vite: true hanya saat `npm run dev`
if (!isDev) return null; // Tidak dirender di production
```

Dengan ini:
- Pemain production tidak bisa mengakses fitur cheat/debug
- Developer tetap bisa testing dengan mudah di `npm run dev`
- Tidak ada risiko pemain curang di build final
