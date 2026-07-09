# Update V1.3 — Balancing & Polish

**Induk:** `docs/update_v1.2.md` (Light Corporate Dashboard)
**Tujuan:** Tuning balancing angka agar game playable, nambah varian fitur per produk, dan polish UI/UX secara keseluruhan.

---

## 1. Balancing Angka (Game Tuning)

Berdasarkan playtest, ditemukan beberapa masalah balancing utama yang membuat game hampir tidak bisa dimainkan: revenue terlalu rendah dibanding biaya operasional.

### Masalah yang Ditemukan

| Masalah | Detail | Dampak |
|---|---|---|
| Ads revenue terlalu rendah | `(users/1000)*2` = $2/1000 users | Bahkan dengan 1000 user, pendapatan iklan hanya $2 |
| Subscription terlalu rendah | `users * 0.5` | Tidak cukup menutup payroll |
| Biaya server & gaji dominan | 1 karyawan = $500/mo | Burn rate terlalu cepat |
| Starting cash terbatas | $10.000 | Hanya cukup 5-6 bulan untuk 3 karyawan |
| Progresi fitur lambat | Base ticks 20-30 per komponen | Butuh ~1 bulan in-game per komponen awal |

### Perubahan Balancing

#### Revenue

| Skenario | Sebelum | Sesudah | Rasio |
|---|---|---|---|
| **Ads per 1000 users** | $2 | **$20** | 10x |
| **Subscription per user** | $0.50 | **$2.00** | 4x |
| **Revenue @500 users** | $1 (ads) + $250 (sub) = $251 | **$10 (ads) + $1000 (sub) = $1010** | 4x |
| **Revenue @1000 users** | $2 + $500 = $502 | **$20 + $2000 = $2020** | 4x |
| **Revenue @5000 users** | $10 + $2500 = $2510 | **$100 + $10,000 = $10,100** | 4x |

```ts
// Sebelum
ads = Math.round((users / 1000) * 2 * penalty);
subscription = Math.round(users * 0.5);

// Sesudah
ads = Math.round((users / 100) * 2 * penalty);  // 10x lebih besar
subscription = Math.round(users * 2);            // 4x lebih besar
```

#### Starting Cash

| Sebelum | Sesudah | Alasan |
|---|---|---|
| $10,000 | **$15,000** | Memberi runway cukup untuk 3 karyawan (~7-8 bulan) |

#### Happiness Decay

| Kondisi | Sebelum | Sesudah |
|---|---|---|
| Saat bekerja | -1/tick | **-1/tick** (tetap) |
| Saat idle | -0.2/tick | **-0.1/tick** (lebih lambat) |
| Bonus happiness > 80 | speed 1.2x | **speed 1.3x** (lebih rewarding) |
| Penalty happiness < 30 | speed 0.5x | **speed 0.6x** (lebih ringan) |

#### Economy Simulation (Estimasi)

```
Early Game (1-2 bulan):
  - 2 Dev + 1 Designer = $1,500/mo
  - 1 Basic Rack + 1 Web T1 = $35/mo
  - 2 fitur built (~300 users) → Ads $6/mo
  - Net: -$1,529/mo → Cash habis dalam ~10 bulan
  → Harus cepat bangun Payment Gateway untuk buka subscription revenue

Mid Game (3-5 bulan):
  - 4-5 karyawan = $2,000-2,500/mo
  - Multi-rack server = $100-200/mo
  - 4 fitur built (~800 users) → Ads $16/mo + Sub $1,600
  - Net: -$484 s.d. +$16/mo → Mendekati break-even

Late Game (6+ bulan):
  - 8+ karyawan, data center
  - Semua fitur level 3+ → 3000+ users
  - Revenue: $60 (ads) + $6,000 (sub) = $6,060
  - Profit: $3,000-4,000/mo → Scaling
```

---

## 2. Varian Fitur Baru (+2 per Produk)

Setiap produk mendapat tambahan 2 fitur baru (total 7 fitur per produk).

### Social Media (+2)

| Fitur | ID | Components | Base Traffic |
|---|---|---|---|
| **Groups** | `groups` | 3 Backend, 2 UI, 2 Network | 250 |
| **Live Streaming** | `live_streaming` | 4 Network, 3 Graphics, 2 Backend | 400 |

### E-Commerce (+2)

| Fitur | ID | Components | Base Traffic |
|---|---|---|---|
| **Wishlist** | `wishlist` | 1 Backend, 2 UI | 80 |
| **Seller Dashboard** | `seller_dashboard` | 3 Backend, 1 UI, 1 Network | 200 |

### Search Engine (+2)

| Fitur | ID | Components | Base Traffic |
|---|---|---|---|
| **Voice Search** | `voice_search` | 3 Network, 3 Backend, 1 Graphics | 250 |
| **Analytics** | `analytics_dashboard` | 2 Backend, 1 UI, 1 Graphics | 150 |

---

## 3. UI Polish

### Notification System
- Toasts: stacking dengan offset vertikal
- Animasi masuk: slide-in + fade, animasi keluar: slide-out + fade
- Warna border & icon sesuai tipe (success/info/warning/error)

### Empty States
- Konsisten: semua panel punya empty state dengan pesan jelas
- Menggunakan ikon Lucide untuk visual (no emoji)

### Transisi & Animasi
- Panel: `transition-all duration-200 ease-out` untuk buka/tutup
- Hover/active: `scale-[0.97]` untuk tombol aksi utama (tanpa layout shift via `transform`)
- Taskbar: chip panel dengan indikasi aktif/minimized lebih jelas

### Layout Refinements
- `panel-content` max-height konsisten
- Spacing antar section lebih rapat (gap 1-2)
- Font sizing konsisten: title 13px, body 12px, secondary 11px, meta 10px

### Main Menu
- Update versi ke **v1.3**
- Efek hover pada tombol menu: `translate-x-1` subtle

### Game Over Screen
- Tampilkan statistik tambahan: total revenue earned, peak users

---

## 4. Perubahan File

| File | Perubahan |
|---|---|
| `src/index.css` | Tambah utility `.transition-smooth`, `.empty-state`, `.badge`, polish animasi |
| `src/data/products.ts` | +2 fitur per produk (Groups, Live Streaming, Wishlist, Seller Dashboard, Voice Search, Analytics) |
| `src/systems/monetization.ts` | Balik: ads 10x, subscription 4x |
| `src/store/gameStore.ts` | Starting cash $15.000, happiness idle decay -0.1, happiness bonus 1.3x/penalty 0.6x |
| `src/components/MainMenu.tsx` | Update versi v1.3, hover effect |
| `src/components/HudBar.tsx` | Subtle animasi pada stat changes |
| `src/components/FinancePanel.tsx` | Tampilkan revenue breakdown lebih detail |
| `src/components/EmployeesPanel.tsx` | Polish badge, spacing |
| `src/components/FeaturesPanel.tsx` | Empty state lebih baik |
| `src/components/OfficeGrid.tsx` | Animasi progress bar smoother, tooltip lebih informatif |
| `src/components/GameOverScreen` (in App.tsx) | Stat tambahan: peak users, total revenue |

---

## 5. Checklist

- [x] Balancing revenue (ads 10x, subscription 4x)
- [x] Starting cash $10,000 → $15,000
- [x] Happiness decay idle -0.2 → -0.1
- [x] Happiness bonus 1.2x → 1.3x, penalty 0.5x → 0.6x
- [x] +2 fitur per produk (total 7/produk)
- [x] UI Polish: transisi, empty states, spacing
- [x] Game Over: stat tambahan
- [x] Main Menu: update versi v1.3
- [x] Update docs/02_TASK.md checklist
- [x] Build sukses (typecheck + lint)

---

## 6. Dev Mode (tetap)

Dev Panel & tombol `DEV` **tetap hanya di `npm run dev`** (`import.meta.env.DEV`).
