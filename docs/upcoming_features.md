# Upcoming Features — Catatan Ide Masa Depan

Dokumen ini berisi ide fitur yang ditunda untuk implementasi setelah v1.3.4. Tidak ada deadline — dikerjakan sesuai prioritas & mood.

---

## 1. Kompetitor AI Simulation (Priority: HIGH)

### Konsep
Startup AI yang muncul random di timeline, compete untuk user acquisition. Pemain harus bersaing dengan 1–3 kompetitor yang juga membangun platform serupa.

### Mekanik

- **Kompetitor Generation**: 1–3 kompetitor muncul di bulan ke-12, 24, 36 (atau triggered oleh metrics player)
- **Market Share**: total users dibagi antara player & kompetitor berdasarkan platform quality
- **Kompetitor Actions**:
  - Upgrade fitur mereka sendiri secara otomatis (AI-driven)
  - Bisa trigger hostile events: DDoS war, PR smear campaign
  - Bisa steal employees (offer higher salary)
- **Competitor Metrics**:
  - `name`, `users`, `featureLevels`, `funding`, `aggressiveness`
  - Ditampilkan sebagai leaderboard atau competitive dashboard

### Integration Points (existing systems)

| Existing System | Competitor Integration |
|---|---|
| **Dynamic Users** | Users split: `playerUsers + compUsers + unservedUsers = totalMarket` |
| **Events** | Competitor bisa trigger events ke player |
| **Funding** | Competitor juga dapet funding rounds, gunakan itu untuk growth spurt |
| **HR/Recruitment** | Competitor bisa poach employee dengan offer lebih tinggi |
| **Cohesion** | Player cohesion vs competitor cohesion — higher wins market share |

### Dependencies

- [ ] v1.3.4 Dynamic Users (currentUsers/targetUsers) — selesai
- [ ] v1.3.4 Events system — selesai
- [ ] AI decision engine: prioritaskan upgrade fitur yang paling low-hanging fruit
- [ ] UI: competitive dashboard (tab baru atau toggle di FinancePanel)

### Status: NOT STARTED

---

## 2. Cooling Refactor ke Grid Level (Priority: MEDIUM)

### Masalah
Cooling fan sekarang di slot rack. Lebih realistis kalau cooling unit ditempatkan di grid data center sebagai facility management.

### Desain
- Cooling jadi standalone object di grid (bukan node dalam rack)
- Punya radius efek: cooling unit mendinginkan semua rack dalam radius N grid cells
- Multiple cooling unit bisa stack efeknya
- Rack tanpa cooling coverage → overheat lebih cepat
- Harga cooling unit lebih mahal (karena standalone), butuh plot space sendiri

### Status: Tunda ke v1.4 (bareng visual server room upgrade)

---

## 3. Visual Kantor Upgrade (Priority: LOW)

### Ide
- Animasi karyawan berjalan di grid
- Meja & dekorasi bisa dibeli (kursi ergonomis, tanaman, coffee machine → +happiness)
- Server room visual dengan rack blinking, cable management
- Bukan prioritas — game logic > visual

### Status: IDE ONLY

---

## 4. Multi-Produk Expansion (Priority: LOW)

### Konsep
Setelah mencapai milestone tertentu, player bisa membuka lini produk kedua (misal: mulai Social Media, lalu buka E-Commerce juga).

### Complexities
- Revenue/traffic dari 2 produk
- Server harus handle beban dari 2 produk dengan karakteristik berbeda
- Employee assignment per produk?
- UI complexity tinggi

### Status: IDE ONLY — tidak masuk scope MVP

---

## 5. Employee Specialization Tree (Priority: LOW)

### Ide
Skill tree per role: Developer bisa spesialisasi ke frontend/backend/security, Designer ke UI/UX/brand.

### Masalah
- V1.3.3 sudah ada level & training
- Skill tree = complexity spike signifikan
- Better setelah core game stable

### Status: IDE ONLY

---

## Catatan Umum

- **Golden rule**: Jangan nambah fitur baru sebelum v1.3.4 selesai & playable.
- Setiap fitur di dokumen ini harus dievaluasi ulang saat mau dikerjakan — ide bisa berubah.
- Jika ada ide baru, tambahkan ke dokumen ini dengan format yang sama.
