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

### **Phase 1 — Lead Developer: Data Model & Supervisi Dasar**
**Difficulty: 🟡 Menengah**

Tujuan: Bangun fondasi data & UI assignment, tanpa efek boost dulu.

- [ ] Tambah field baru di `Employee` type: `supervisedBy?: string` (employee id lead-nya), dan di Lead: `supervising: string[]` (list id developer).
- [ ] Validasi assignment:
  - Hanya role `Lead_Developer` yang bisa punya `supervising`.
  - Hanya role `Developer` yang bisa punya `supervisedBy`.
  - 1 developer hanya bisa di-supervise oleh 1 lead pada satu waktu.
  - Cap maksimum developer per lead **scale sesuai level lead** (formula & angka pasti didesain di Phase 2, lihat tabel cap).
- [ ] UI: Tambah panel/modal di `EmployeesPanel.tsx` — saat klik Lead Developer, muncul list developer yang tersedia untuk di-assign/unassign (checkbox atau drag list).
- [ ] Update `gameStore.ts` — actions: `assignDeveloperToLead()`, `unassignDeveloperFromLead()`.
- [ ] Handle edge case: developer resign/dipecat saat masih di-supervise → auto unassign dari lead.
- [ ] Handle edge case: lead resign/dipecat → semua developer yang disupervisi otomatis unassigned (fallback ke normal production).

**Risk/Notes:** Ini murni data + UI, tidak menyentuh tick loop production sama sekali. Aman untuk dikerjakan pertama.

---

### **Phase 2 — Lead Developer: Production Boost Logic**
**Difficulty: 🔴 Sulit**

Tujuan: Implementasi efek boost ke tick loop.

- [ ] Di `systems/platform.ts` (atau buat `systems/leadDeveloper.ts` baru untuk isolasi logic):
  ```
  function getSupervisionBoost(lead: Employee): number {
    return lead.speed * 0.1
  }
  ```
- [ ] Modifikasi kalkulasi produksi komponen developer di tick loop:
  - Jika developer punya `supervisedBy`, cari lead-nya, hitung boost, terapkan ke output produksi tick tersebut.
  - **Keputusan final: TANPA penalti/diminishing return.** Setiap developer yang disupervisi dapat boost penuh `leadSpeed × 0.1`, terlepas dari berapa banyak developer lain yang disupervisi lead yang sama. Opportunity cost (lead gak produksi sendiri) sudah jadi balancing natural, tidak perlu penalti buatan tambahan.
    ```
    outputBoost = lead.speed × 0.1
    finalOutput = developer.baseOutput × (1 + outputBoost)
    ```
- [ ] **Cap jumlah developer per lead — scale sesuai level lead.** Formula yang direkomendasikan (linear sederhana, mudah dibalance):
  ```
  maxSupervised = baseCap + (lead.level - 1) × capPerLevel
  ```
  Contoh nilai awal untuk playtest (`baseCap = 2`, `capPerLevel = 1`):

  | Lead Level | Max Developer Disupervisi |
  |---|---|
  | 1 | 2 |
  | 2 | 3 |
  | 3 | 4 |
  | 4 | 5 |
  | 5 | 6 |

  - Cap ini otomatis naik saat lead level up (training selesai) — perlu handle di action `levelUpEmployee`/hasil training: kalau lead sudah supervise developer melebihi cap baru... (tidak relevan di sini karena cap **naik**, jadi tidak ada developer yang perlu di-unassign otomatis. Hanya perlu update `maxSupervised` yang ditampilkan di UI).
  - UI assignment (Phase 1) harus baca `maxSupervised` ini secara dinamis — disable opsi assign kalau lead sudah di cap.
- [ ] Tambahkan **soft cap global** di luar level scaling (misal hard limit 10, jaga-jaga kalau lead level sangat tinggi di late game) — cukup sebagai safety net, bukan constraint utama.
- [ ] Update save/load schema (Dexie v8) — tambah field `supervisedBy`/`supervising` ke persisted state.
- [ ] Balancing pass: karena boost tanpa penalti + cap naik seiring level, lead level tinggi berpotensi jadi sangat kuat (misal lead level 5, speed tinggi, supervise 6 developer semua dapat boost penuh). Playtest fokus ke:
  - Apakah salary Lead Developer + training cost cukup mahal untuk balance power ini?
  - Apakah perlu diminishing return di level lead yang sangat tinggi nanti (v2, di luar scope Phase 2 ini)?

**Risk/Notes:** Ini menyentuh core tick loop production — butuh testing ketat biar gak break economy balance yang sudah ada. Rekomendasi: buat feature flag/dev toggle dulu sebelum full release.

---

### **Phase 3 — Lead Developer: UI Polish & Visual Feedback**
**Difficulty: 🟢 Mudah**

- [ ] Badge visual di `OfficeGrid.tsx` — garis penghubung/ikon kecil antara Lead dan developer yang disupervisi (opsional, bisa simple color-coding dulu).
- [ ] Tooltip di `EmployeeCard` — tampilkan "Supervised by [Lead Name] (+X% output)" untuk developer, dan "Supervising: 3/5 developers" untuk lead.
- [ ] Indicator di HUD/Panel Fitur kalau production rate naik akibat supervisi (opsional, nice-to-have).

---

### **Phase 4 — Office Grid Refactor: Modular Positioning**
**Difficulty: 🔴 Sulit**

Tujuan: Ubah OfficeGrid dari layout statis jadi grid modular seperti ServerRoomView.

- [ ] Definisikan tipe grid baru: `OfficeSlot { x, y, occupantType: 'employee' | 'furniture' | 'empty', occupantId?: string }`.
- [ ] Refactor `OfficeGrid.tsx` — render grid berbasis koordinat, bukan list statis per employee.
- [ ] Implementasi drag & drop (reuse pattern dari `ServerRoomView.tsx` kalau sudah ada drag & drop rack — konsisten UX).
- [ ] Migrasi data existing: employee lama yang belum punya posisi grid → auto-assign ke slot kosong pertama saat load save lama (migration script, bump Dexie version).
- [ ] Validasi: slot yang sudah terisi tidak bisa ditumpuk; batas grid size ditentukan sesuai luas kantor (bisa dikaitkan ke office upgrade/expansion nanti).

**Risk/Notes:** Ini refactor besar terhadap komponen existing yang sudah stabil (OfficeGrid). Rekomendasi kerjakan di branch terpisah + migration testing dengan save file lama.

---

### **Phase 5 — Furniture Perk/Unlock System**
**Difficulty: 🟡 Menengah**

- [ ] Buat `data/perks.ts` — daftar perk/milestone yang unlock furniture (contoh: "Reach 10 employees" → unlock Coffee Machine; "Cash $50,000" → unlock Ergonomic Chairs).
- [ ] State baru di `gameStore.ts`: `unlockedPerks: string[]`.
- [ ] Tick loop check: setiap tick/bulan, cek kondisi milestone, kalau terpenuhi → push ke `unlockedPerks` + trigger notifikasi (reuse `EventBanner.tsx` pattern untuk notif unlock).
- [ ] UI: Tambah tab "Perks" di panel yang relevan (atau modal terpisah) menampilkan perk yang sudah/belum unlock beserta requirement-nya (progress bar kalau relevan).

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
|---|---|---|---|
| 1 | Lead Dev — Data & Assignment UI | 🟡 | - |
| 2 | Lead Dev — Production Boost Logic | 🔴 | Phase 1 |
| 3 | Lead Dev — UI Polish | 🟢 | Phase 2 |
| 4 | Office Grid — Modular Refactor | 🔴 | - (independen, tapi prasyarat Phase 6) |
| 5 | Furniture — Perk/Unlock System | 🟡 | - |
| 6 | Furniture — Shop & Placement | 🟡 | Phase 4, Phase 5 |
| 7 | Balancing & QA Gabungan | 🔴 | Semua phase di atas |

**Catatan urutan kerja realistis:**
Phase 1-3 (Lead Dev) dan Phase 4-5 (Office Grid + Perks) bisa dikerjakan **paralel** karena tidak saling bergantung. Phase 6 baru bisa mulai setelah Phase 4 & 5 selesai. Phase 7 di akhir sebagai integrasi & polish penuh.

---

## ✅ Keputusan Desain — Final

1. **Boost formula**: `outputBoost = leadSpeed × 0.1`, diterapkan **penuh tanpa penalti/diminishing return** ke setiap developer yang disupervisi. Opportunity cost lead tidak produksi sendiri sudah cukup jadi balancing natural.
2. **Cap maksimum developer per lead**: **scale sesuai level lead** — `maxSupervised = baseCap + (level - 1) × capPerLevel`. Nilai awal untuk playtest: `baseCap = 2`, `capPerLevel = 1` (lihat tabel di Phase 2). Ada soft cap global (misal 10) sebagai safety net di late game.

## ⚠️ Keputusan Desain yang Masih Perlu Difinalisasi

1. **Radius furniture**: pakai grid distance (tile-based) atau area tetap (3x3, dsb) — konsisten dengan rencana Cooling Grid supaya bisa reuse logic yang sama?
2. **Migration strategy**: auto-placement grid lama pakai algoritma apa (baris demi baris? spiral?) supaya tidak ada employee yang "hilang" posisinya saat migrasi save lama.
3. **Nilai `baseCap`/`capPerLevel` final**: angka di tabel Phase 2 masih tentatif untuk playtest awal — perlu divalidasi setelah balancing pass di Phase 7, terutama terhadap salary cost Lead Developer supaya power scaling-nya gak OP di late game.