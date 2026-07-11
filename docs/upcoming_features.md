# Plan Pengembangan: Lead Developer Mechanic & Office Furniture System

Dokumen ini merinci rencana implementasi dua fitur besar berikutnya untuk Startup Simulator:
1. **Lead Developer Mechanic** — supervisi tim & production boost
2. **Office Furniture System** — grid kantor dinamis + perk unlock

---

## 🎯 Konsep Inti

### Lead Developer
- Lead Developer adalah role yang bisa **menaungi (supervise) beberapa Developer** di sekitarnya.
- Saat lead di-hire dan ditempatkan di grid kantor, pemain bisa **assign developer mana saja** (tidak harus berdasarkan jarak fisik, tapi bisa dipertimbangkan sebagai constraint di fase lanjut) ke bawah supervisinya.
- **Efek boost**: Output developer yang di-supervise naik berdasarkan work speed Lead.
  - Formula dasar: `outputBoost = leadWorkSpeed × 0.1`
  - Contoh: Lead speed 3x → boost = +0.3x (30% tambahan output) untuk tiap developer yang disupervisi.
  - Boost ini terpisah dari efek happiness/training milik developer itu sendiri (stackable, multiplicative atau additive — diputuskan di Phase 1).
- Lead Developer sendiri juga memproduksi resource (tidak hilang fungsi dasarnya), tapi opportunity cost: makin banyak develeoper yang di-supervise, makin besar value lead sebagai "manager" dibanding "individual contributor".

### Office Furniture
- Office grid berubah dari **grid statis (fixed desk positions)** menjadi **grid modular** mirip Server Room Grid — pemain bisa reposisi meja karyawan & menempatkan furniture di slot manapun.
- Furniture di-unlock lewat **perk/tech-tree sederhana** (bukan langsung available dari awal) — reward dari milestone tertentu (cash, jumlah karyawan, dsb).
- Efek furniture bersifat **radius-based** (mirip rencana Cooling Grid) — karyawan dalam radius furniture tertentu kena efeknya.

---

## 📋 Struktur Fase & Tingkat Kesulitan

Skala kesulitan: 🟢 Mudah | 🟡 Menengah | 🔴 Sulit | ⚫ Sangat Kompleks

---

---

### **Phase 2 — Lead Developer: Production Boost Logic**
**Difficulty: 🔴 Sulit**

Tujuan: Implementasi efek boost ke tick loop.

- [x] Di `systems/leadDeveloper.ts` — `getSupervisionBoost(lead)`:
  ```ts
  function getSupervisionBoost(lead: Employee): number {
    return lead.speed * 0.1
  }
  ```
- [x] Modifikasi kalkulasi produksi komponen developer di tick loop:
  - Jika developer punya `supervisedBy`, cari lead-nya, hitung boost, terapkan ke `newSpeed`.
  - **Keputusan final: TANPA penalti/diminishing return.** Setiap developer yang disupervisi dapat boost penuh `leadSpeed × 0.1`, terlepas dari berapa banyak developer lain yang disupervisi lead yang sama. Opportunity cost (lead gak produksi sendiri) sudah jadi balancing natural, tidak perlu penalti buatan tambahan.
  - Boost diterapkan unconditional (produksi + training) — mentorship effect.
  - 1-tick delay: boost di `newSpeed` (dipakai tick berikutnya).
- [x] **Cap jumlah developer per lead — scale sesuai level lead.** (Phase 1 — `calcMaxSupervised`)
- [x] Tambahkan **soft cap global** (Phase 1 — 10)
- [x] Update save/load schema Dexie v8 (Phase 1)
- [ ] **Balancing pass** (dilakukan di Phase 7): karena boost tanpa penalti + cap naik seiring level, lead level tinggi berpotensi jadi sangat kuat. Playtest fokus ke:
  - Apakah salary Lead Developer + training cost cukup mahal untuk balance power ini?
  - Apakah perlu diminishing return di level lead yang sangat tinggi nanti (v2, di luar scope Phase 2 ini)?

**Risk/Notes:** Ini menyentuh core tick loop production — butuh testing ketat biar gak break economy balance yang sudah ada. Rekomendasi: buat feature flag/dev toggle dulu sebelum full release.

---

### **Phase 3 — Lead Developer: UI Polish & Visual Feedback** ✅ `v1.4.2`
**Difficulty: 🟢 Mudah**

- [x] Badge visual di `OfficeGrid.tsx` — ikon/indicator visual untuk Lead & developer yang disupervisi.
- [x] Tooltip di `EmployeeCard` — tampilkan "Supervised by [Lead Name] (+X% output)" untuk developer, dan "Supervising: X/Y (+X% boost each)" untuk lead.
- [x] Indicator di HUD — supervision active indicator saat ada developer yang disupervisi.

---

### **Phase 4 — Office Grid Refactor: Modular Positioning** ✅ `v1.4.3`
**Difficulty: 🔴 Sulit**

Tujuan: Ubah OfficeGrid dari layout statis jadi grid modular seperti ServerRoomView.

- [x] Definisikan tipe grid baru: `OfficeSlot { x, y, occupantType: 'employee' | 'furniture' | 'empty', occupantId?: string }`.
- [x] Refactor `OfficeGrid.tsx` — render grid berbasis koordinat, bukan list statis per employee.
- [x] Implementasi drag & drop (reuse pattern dari `ServerRoomView.tsx` — konsisten UX).
- [x] Migrasi data existing: employee lama dengan `deskIndex` → auto-convert ke `gridX`/`gridY` saat load (Dexie v9).
- [x] Validasi: slot terisi tidak bisa ditumpuk; grid size dari store (`officeGridCols`/`officeGridRows`).

**Risk/Notes:** Ini refactor besar terhadap komponen existing yang sudah stabil (OfficeGrid). Rekomendasi kerjakan di branch terpisah + migration testing dengan save file lama.

---

### **Phase 5 — Furniture Perk/Unlock System** 🚧 `v1.4.4` (in progress)
**Difficulty: 🟡 Menengah**

> **Desain final (v1.4.4):** pakai **Perk Point system** (bukan auto-unlock pasif). Milestone kasih Perk Point, player spend point buat unlock perk/furniture. Sumber hybrid: fixed milestone (early game) + repeatable (`survival_6mo`, late game). Detail di `docs/update_v1.4.4.md`.

- [x] Buat `data/milestones.ts` — daftar milestone yang kasih Perk Point (10 fixed + 1 repeatable), pakai `PerkContext`.
- [x] Buat `data/perks.ts` — daftar perk (Coffee Machine, Ergonomic Chair, Water Dispenser), masing-masing cost 1 point + `furnitureUnlock`.
- [x] State baru di `gameStore.ts`: `perkPoints: number`, `earnedMilestones: string[]`, `unlockedPerks: string[]`.
- [x] Action `checkMilestones()` — scan milestone tiap tick, award point, trigger notif "Milestone Clear".
- [x] Action `unlockPerk(perkId)` — spend point, push ke `unlockedPerks`, notif "Perk Unlocked".
- [x] UI: `PerksPanel.tsx` — 2 tab (Milestones progress / Unlock Perks) + tombol Dock "Perks".
- [x] Tick loop hook: `checkMilestones()` di `incrementTick`.
- [x] Dexie v10 + save/load 3 field baru.

> **Belum dikerjakan (Phase 6):** efek furniture radius/decay aktual. Phase 5 cuma unlock gate.

---

### **Phase 6 — Furniture Shop & Placement**
**Difficulty: 🟡 Menengah**

- [ ] Buat `data/furniture.ts` — daftar furniture, harga, efek, radius:
  | Furniture | Harga | Efek | Radius |
  |---|---|---|---|
  | Coffee Machine | $300 | -50% happiness decay (kerja) | 2 tile |
  | Ergonomic Chair | $150/unit | Overwork threshold 50→80 tick | Per-tile (attached ke meja) |
  | Water Dispenser | $250 | +0.2/tick happiness recovery saat idle | 2 tile |
- [ ] Buat komponen `FurnitureShop.tsx` (mirip pattern `ServerShop.tsx`) — hanya tampil item yang sudah di-unlock via Perks.
- [ ] Placement logic: reuse grid system dari Phase 4 — klik item di shop → mode placement → klik slot kosong di `OfficeGrid`.
- [ ] Efek radius: hitung jarak Manhattan/Euclidean dari furniture ke tiap employee slot, terapkan efek kalau dalam radius (logic mirip rencana Cooling Grid radius — bisa reuse helper function yang sama, disarankan ekstrak jadi shared utility `systems/radiusEffect.ts`).

**Risk/Notes:** Menyentuh tick loop lagi (happiness decay calculation) — testing balancing diperlukan supaya furniture worth dibeli tapi gak trivialisasi happiness management yang sudah ada.

---

### **Phase 7 — Balancing, Save Migration & QA**
**Difficulty: 🔴 Sulit**

- [ ] Full regression test: save file lama (pre-refactor) harus tetap loadable dengan migration otomatis.
- [ ] Balancing pass gabungan: Lead Developer boost + Furniture happiness buff bersamaan — cek apakah kombinasi ini terlalu kuat (misal max happiness employee jadi selalu 100 dan gak realistis).
- [ ] Update dokumentasi (`README.md`, `docs/update_v1.4.md` atau versi terkait) dengan mekanik baru.
- [ ] Dev toggle/cheat panel (`DevPanel.tsx`) — tambah tombol untuk unlock semua perk & spawn furniture untuk mempercepat testing.

---

## 📊 Ringkasan Urutan & Effort

| Phase | Fitur | Difficulty | Dependency |
|---|---|---|---|---|---|
| ~~1~~ ✅ | ~~Lead Dev — Data & Assignment UI~~ | 🟡 | - |
| ~~2~~ ✅ | ~~Lead Dev — Production Boost Logic~~ | 🔴 | Phase 1 ✅ |
| ~~3~~ ✅ ~~v1.4.2~~ | ~~Lead Dev — UI Polish~~ | 🟢 | Phase 2 |
| ~~4~~ ✅ ~~v1.4.3~~ | ~~Office Grid — Modular Refactor~~ | 🔴 | - |
| 5 🚧 `v1.4.4` | Furniture — Perk/Unlock System (Perk Points) | 🟡 | - |
| 6 | Furniture — Shop & Placement | 🟡 | Phase 4, Phase 5 |
| 7 | Balancing & QA Gabungan | 🔴 | Semua phase di atas |

**Catatan urutan kerja realistis:**
Phase 2-3 (Lead Dev) sudah selesai. Phase 5 (Perks) bisa dikerjakan **paralel** dengan Phase 6 (Shop & Placement) karena grid sudah modular. Phase 6 butuh Phase 5 selesai. Phase 7 di akhir sebagai integrasi & polish penuh.

---

## ✅ Keputusan Desain — Final

1. **Boost formula**: `outputBoost = leadSpeed × 0.1`, diterapkan **penuh tanpa penalti/diminishing return** ke setiap developer yang disupervisi. Opportunity cost lead tidak produksi sendiri sudah cukup jadi balancing natural.
2. **Cap maksimum developer per lead**: **scale sesuai level lead** — `maxSupervised = baseCap + (level - 1) × capPerLevel`. Nilai awal untuk playtest: `baseCap = 2`, `capPerLevel = 1` (lihat tabel di Phase 2). Ada soft cap global (misal 10) sebagai safety net di late game.

## ⚠️ Keputusan Desain yang Masih Perlu Difinalisasi

1. **Radius furniture**: pakai grid distance (tile-based) atau area tetap (3x3, dsb) — konsisten dengan rencana Cooling Grid supaya bisa reuse logic yang sama?
2. ~~**Migration strategy**:~~ ✅ Resolved — konversi `deskIndex` → `gridX = deskIndex % 8, gridY = floor(deskIndex / 8)` di saveLoad.ts.
3. **Nilai `baseCap`/`capPerLevel` final**: angka di tabel Phase 2 masih tentatif untuk playtest awal — perlu divalidasi setelah balancing pass di Phase 7, terutama terhadap salary cost Lead Developer supaya power scaling-nya gak OP di late game.