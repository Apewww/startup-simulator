# Development Plan
## Tech Startup Simulator (Personal Project)

Dokumen ini adalah rencana strategis tingkat tinggi. Untuk detail desain sistem lihat `03_GDD.md`, untuk breakdown kerja harian/mingguan lihat `02_TASK.md`.

---

## 1. Tujuan Proyek

Membangun game simulasi manajemen startup teknologi mirip *Startup Company*, untuk dimainkan sendiri secara offline di desktop. Prioritas: **selesai dan playable**, bukan sempurna atau siap jual.

---

## 2. Tech Stack (Final)

| Layer | Pilihan | Alasan Singkat |
|---|---|---|
| Frontend | React + TypeScript | Modular, type-safe untuk data kompleks |
| Desktop Shell | Tauri | Installer kecil, hemat RAM dibanding Electron |
| State Management | Zustand | Ringan, cocok untuk game loop dengan update tiap tick |
| Styling | Tailwind CSS | Cepat untuk bikin dashboard/UI data-heavy |
| Save/Load | IndexedDB (Dexie.js) | Tidak terbatas 5MB seperti localStorage |
| Visual (fase lanjut) | HTML5 Canvas atau CSS Grid | Render kantor 2D sederhana |

Tidak ada perubahan dari dokumen awal — stack ini sudah tepat untuk scope proyek.

---

## 3. Prinsip Pengembangan

1. **Logic dulu, visual belakangan.** Semua sistem harus jalan dan masuk akal dalam bentuk angka/teks sebelum ada 1 pun sprite digambar.
2. **Playable secepat mungkin.** Setelah Fase 1 selesai, harus sudah bisa "main" walau tampilannya seperti spreadsheet.
3. **Iterasi kecil.** Tiap fase dipecah jadi task yang bisa selesai dalam 1 sesi kerja (lihat `02_TASK.md`).
4. **Karena solo & personal:** tidak perlu proses tim (tidak ada sprint planning formal, code review, dsb) — cukup checklist progres.

---

## 4. Roadmap Besar (4 Fase)

### Fase 1 — "Excel Phase" (Logika Murni)
Tujuan: game loop dasar jalan, tanpa visual. Bisa dites lewat console/log & UI teks minimal.
- Setup project (Vite + Tauri + React + TS).
- Game loop (tick system) jalan dengan kontrol pause/speed.
- Sistem saldo, gaji otomatis tiap "bulan" in-game.
- Sistem karyawan dasar: rekrut, produksi komponen, progress bar tekstual.

**Definisi selesai:** Bisa rekrut karyawan, karyawan produksi komponen, saldo berkurang tiap bulan karena gaji — semua terlihat lewat angka di layar (boleh masih sangat kasar/tanpa styling).

---

### Fase 2 — Platform & Server Management
Tujuan: loop inti lengkap — produksi → fitur → traffic → server → uang masuk.
- Sistem Platform Feature (bangun & upgrade fitur).
- Kalkulasi traffic → users → RPS.
- Sistem server (load, capacity, crash trigger).
- Sistem monetisasi (Ads Contract, Subscription).
- Dashboard UI dengan Tailwind (masih flat, belum visual kantor).

**Definisi selesai:** Loop penuh bisa dimainkan dari awal (garasi kosong) sampai punya beberapa karyawan, fitur, server, dan pendapatan — dan bisa *bangkrut* atau *server crash* sebagai konsekuensi nyata.

---

### Fase 3 — Visual Kantor
Tujuan: representasi visual sederhana, bukan fitur baru.
- Grid 2D kantor (CSS Grid atau Canvas).
- Render meja, kursi, sprite karyawan sesuai status (bekerja/idle).
- Sinkronisasi state logic ↔ tampilan visual.

**Definisi selesai:** Kantor terlihat sebagai grid dengan karyawan bergerak/berubah status sesuai data, bukan cuma tabel angka.

---

### Fase 4 — Integrasi Tauri & Build Desktop
Tujuan: jadi aplikasi desktop yang bisa dijalankan seperti game biasa.
- Konfigurasi Tauri (file system access untuk save file jika perlu).
- Sistem Save/Load pakai IndexedDB.
- Build `.exe` untuk dijalankan lokal.

**Definisi selesai:** Ada file `.exe` yang bisa dibuka, progress tersimpan otomatis/manual, dan bisa dilanjut setelah ditutup.

---

## 5. Estimasi Waktu (Kasar, untuk 1 orang, part-time)

| Fase | Estimasi |
|---|---|
| Fase 1 | 1–2 minggu |
| Fase 2 | 2–4 minggu (paling kompleks) |
| Fase 3 | 1–2 minggu |
| Fase 4 | 3–5 hari |

Total kasar: **~6–10 minggu** kerja part-time. Bisa lebih cepat kalau scope MVP di GDD dipatuhi ketat (jangan nambah fitur di tengah jalan).

---

## 6. Risiko & Mitigasi

| Risiko | Mitigasi |
|---|---|
| Scope creep (nambah fitur kompetitor AI, hacking mini-game, dll) | GDD sudah eksplisit men-drop fitur ini untuk MVP — patuhi |
| Balancing angka terasa aneh (terlalu mudah/susah) | Baseline angka sudah ditulis di GDD bagian 7, tinggal tuning setelah playtest sendiri |
| Kehilangan progres coding | Pakai Git dari awal walau solo project |
| Burnout di Fase 2 (paling berat) | Pecah jadi task kecil, lihat `02_TASK.md` |
| Visual (Fase 3) menghabiskan waktu berlebih | Ingat prinsip: visual itu opsional/nice-to-have, jangan sampai mengorbankan Fase 1–2 yang jadi inti gameplay |

---

## 7. Langkah Selanjutnya

Buka `02_TASK.md` untuk daftar task konkret Fase 1, mulai dari task pertama: inisialisasi project.
