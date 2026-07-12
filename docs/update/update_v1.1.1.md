# Update V1.1.1 — Fresh Game UI & Mobile Responsive (Child of V1.1)

**Induk:** `docs/update_v1.1.md` (Command Center layout, floating panels, dock)
**Berdasarkan:** UI/UX Pro Max Skill — Design System "Modern Startup" (Space Grotesk + DM Sans) + UX Guideline *Mobile Responsive / Bottom Navigation / Touch Friendly*
**Tujuan:** Membuat UI terasa **lebih segar & "game"** (inspirasi *Startup Company*), sambil menambahkan **dukungan responsif mobile**.

---

## 1. Filosofi: Dari "Retro Neon" ke "Modern Startup Game"

V1.1 memakai Retro-Futurism (CRT scanline, neon berat). Untuk terasa seperti *Startup Company* (bersih, ramah, modern, tapi tetap game), kita **soften** gaya tersebut:

| Aspek | V1.1 (Retro) | V1.1.1 (Fresh / Startup Company) |
|---|---|---|
| **Font** | Share Tech Mono + Fira Code | **Space Grotesk** (display) + **DM Sans** (body) — lebih modern & ramah |
| **Mood** | Sci-fi terminal gelap | Startup modern, bersih, playful tapi profesional |
| **Surface** | Transparan gelap + scanline | **Glass card** (`rounded-2xl`, soft shadow), scanline dikurangi jadi sangat halus/opsional |
| **Warna** | Neon ungu/cyan berat | Primary `#7C3AED` tetap, tapi surface lebih terang & aksen oranye `#F97316` sebagai CTA; cyan jadi aksen sekunder lembut |
| **Corner** | Bracket HUD tajam | Sudut membulat (`rounded-xl`/`rounded-2xl`), lebih "game casual" |
| **Shadow** | Neon glow tebal | Soft shadow (`shadow-lg`) + glow tipis hanya di elemen aktif |

> Catatan: Palette utama (`--color-primary #7C3AED`, `--color-cta #F97316`) **dipertahankan** dari V1.0/MASTER.md agar konsisten.

---

## 2. Layout Baru (inspirasi Startup Company)

```
DESKTOP (>1024px)
┌──────────────────────────────────────────────────────────────────┐
│  TOP BAR: 🏢 Name | 💰 Cash | 📅 Date | ⏸ 1x 2x 4x | Save/Load    │
├──────┬───────────────────────────────────┬────────────────────────┤
│ TOOL │                                   │  SLIDE-IN PANELS        │
│ RAIL │      OFFICE FLOOR (top-down)      │  (Employees/Features/   │
│(kiri)│   grid meja + karyawan sprite     │   Server/Finance)       │
│      │   klik meja → assign task         │  muncul dari kanan,      │
│[Emp] │                                   │  bisa swipe/close        │
│[Feat│                                   │                          │
│[Srv] │                                   │                          │
│[Fin] │                                   │                          │
└──────┴───────────────────────────────────┴────────────────────────┘

MOBILE (<768px)
┌─────────────────────────────┐
│ TOP BAR (kompak, wrap)       │  Cash | Date | Speed
├─────────────────────────────┤
│                             │
│   OFFICE FLOOR (scroll)     │  grid mengecil / horizontal scroll
│                             │
├─────────────────────────────┤
│  BOTTOM TAB BAR (fixed)     │  [Emp][Feat][Srv][Fin]  <- navigasi
└─────────────────────────────┘
   Panel = FULL-SCREEN SHEET (slide dari bawah)
```

### Perubahan dari V1.1
1. **Dock kiri → Tool Rail** dengan ikon lebih besar & label pendek, indikator aktif berupa pill/underline (bukan hanya glow).
2. **FloatingPanel → Slide-in Sheet**: animasi `translate-x` dari kanan (desktop) / `translate-y` dari bawah (mobile). Bukan sekadar muncul.
3. **Office Floor** jadi elemen utama yang bisa diklik (klik meja karyawan → quick action / buka panel Employees dengan karyawan itu ter-select).
4. **Bottom Tab Bar** menggantikan Dock di mobile.

---

## 3. Responsif Mobile (Rencana)

Mengikuti UX guideline UI/UX Pro Max: *Mobile First*, *Touch Friendly* (target ≥44px), *Viewport meta* (sudah ada), *Sticky nav tidak menutupi konten*.

| Breakpoint | Perilaku |
|---|---|
| `<640px` (mobile) | Dock → **bottom tab bar** fixed. Panel → **full-screen bottom sheet**. HudBar wrap jadi 2 baris, hanya stat penting (Cash, Date, Speed). Office grid scroll vertikal/horizontal. |
| `640–1024px` (tablet) | Tool rail kiri tetap (ikon saja, tanpa label). Panel slide-in lebar ~90%. Office grid 2 kolom area. |
| `>1024px` (desktop) | Layout penuh V1.1.1 (rail + office + slide-in panel kanan). |

### Aturan teknis (Tailwind)
- Gunakan **mobile-first**: class default = mobile, lalu `sm:` `md:` `lg:` `xl:` untuk enhance.
- Touch target minimal `h-11 w-11` (44px) di mobile untuk tombol dock/tab & kontrol speed.
- Panel mobile: `fixed inset-x-0 bottom-0 max-h-[85vh] rounded-t-2xl` + `translate-y` animation; backdrop `bg-black/50`.
- OfficeGrid di mobile: bungkus `overflow-x-auto` agar grid 8 kolom bisa di-scroll, atau turunkan ke 6 kolom via `grid-cols-6 lg:grid-cols-8`.
- HudBar: `flex-wrap`, stat tidak esensial sembunyi di `<sm` (`hidden sm:flex`).

---

## 4. Sentuhan "Game" ala Startup Company

1. **Desk & chair sprite** — `CharacterAvatar` diperkaya: tiap karyawan tampil sebagai **meja + kursi + tubuh** (SVG inline), bukan hanya badge. Warna net sesuai role.
2. **Hover/active desk** — meja menyala (ring) saat diklik; tooltip task/happiness tetap ada.
3. **Ambiance kantor** — latar office pakai gradient lembut + grid garis tipis (bukan scanline berat) untuk kesan "ruang kerja hidup".
4. **Micro-interaction** — panel slide-in dengan `ease-out` 200–250ms; tombol punya `active:scale-95` halus (bukan layout shift).
5. **Empty state ramah** — "No employees yet" pakai ilustrasi kecil + CTA "Hire your first dev".
6. **Progress bar task** mengambang di atas meja karyawan yang sedang bekerja (opsional, V1.1 sudah ada di card).

---

## 5. Typography & Asset Update

- **Font**: ganti heading ke **Space Grotesk**, body ke **DM Sans** (`index.html` + `@theme --font-heading/--font-body`).
  Import: `https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Space+Grotesk:wght@400;500;600;700&display=swap`
- **Ikon**: tetap **Lucide** (no emoji). Dock/tab pakai ikon sama dari V1.1.
- **Karakter**: `CharacterAvatar.tsx` (SVG inline, offline) — tetap tanpa unduh eksternal.

---

## 6. Komponen yang Diubah (rencana implementasi)

| File | Perubahan |
|---|---|
| `src/index.css` | `--font-heading: 'Space Grotesk'`, `--font-body: 'DM Sans'`; soften scanline (opacity ↓); tambah util `.glass-card`, `.sheet-bottom` |
| `index.html` | Ganti font link ke Space Grotesk + DM Sans |
| `src/components/Dock.tsx` | Responsif: `flex-col` kiri di desktop, `fixed bottom-0` tab bar di mobile (`md:` break). Tambah label & active pill |
| `src/components/FloatingPanel.tsx` | Animasi slide-in (`translate-x` desktop / `translate-y` mobile); di mobile jadi full-screen sheet + backdrop |
| `src/components/HudBar.tsx` | Mobile-first wrap; sembunyikan stat non-esensial di `<sm`; touch target ≥44px |
| `src/components/CharacterAvatar.tsx` | Tambah meja + kursi (SVG) untuk kesan game |
| `src/components/OfficeGrid.tsx` | Klik meja → trigger panel Employees (select karyawan); grid responsif `grid-cols-6 lg:grid-cols-8`; ambiance gradient |
| `src/components/MainViewport.tsx` | Frame lebih lembut (`rounded-2xl`, soft shadow), label "OFFICE FLOOR" tetap |

---

## 7. Checklis Pre-Delivery (UI/UX Pro Max)
- [x] No emoji sebagai ikon (Lucide SVG)
- [x] `cursor-pointer` di semua elemen interaktif
- [x] Hover/active state smooth 150–250ms, tanpa layout shift
- [x] Kontras teks min 4.5:1
- [x] Focus state visible (keyboard nav)
- [x] `prefers-reduced-motion` dihormati
- [x] **Responsif 375 / 768 / 1024 / 1440**
- [x] **Touch target ≥44px di mobile**
- [x] Viewport meta ada (sudah di `index.html`)
- [x] Sticky nav (bottom tab) tidak menutupi konten (beri `pb` pada container)

---

## 8. Dev Mode (tetap)
Dev Panel & tombol `DEV` **tetap hanya di `npm run dev`** (`import.meta.env.DEV`).
