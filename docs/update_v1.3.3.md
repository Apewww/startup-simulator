# Update V1.3.3 — HR & Recruitment System + Theme Color Fixes

**Induk:** `docs/update_v1.3.2.md` (SysAdmin & Funding Rounds)
**Tujuan:** Overhaul sistem rekrutmen dari klik instan menjadi proses negosiasi/level locking + perbaikan warna tombol di dark/light theme.

---

## 1. HR & Recruitment System

### Tujuan
- Rekrutmen instan → proses investasi waktu & modal
- Level locking: batasan peran berdasarkan level staf
- Negosiasi interaktif: mini-game tawar gaji berbasis mood AI

### Struktur Data Baru

#### SourcingCampaign
```ts
export interface SourcingCampaign {
  tier: 'basic' | 'pro' | 'headhunter';
  daysLeft: number; // Berkurang tiap tick
}
```

#### Applicant
```ts
export interface Applicant {
  id: string;
  name: string;
  role: 'Developer' | 'Designer' | 'Lead Developer' | 'SysAdmin';
  level: number; // 1–3
  speed: number; // 0.8–1.5
  expectedSalary: number;
  minAcceptableSalary: number;
  mood: 'patient' | 'stubborn' | 'volatile';
  negotiationRounds: number;
  status: 'pending' | 'countered' | 'rejected' | 'hired';
}
```

### Logika Negosiasi Gaji

- **Tawaran >= expectedSalary** → langsung Hired
- **Tawaran < minAcceptableSalary**:
  - Volatile: 70% chance reject langsung
  - Stubborn: 40% chance reject langsung
  - Jika tidak reject, kandidat tolak turunkan tuntutan
- **Tawaran >= minAcceptableSalary && < expectedSalary**:
  - Counter offer (jalan tengah)
  - Turun sesuai mood: Patient -15%, Volatile/Stubborn -5–10%
- **Batas ronde**: Patient 4x, Stubborn 2x, Volatile 1x → rejected

### Level Locking per Komponen

| Komponen | Role | Min Level | Base Ticks |
|---|---|---|---|
| UI Component | Designer | Lv1 | 20 |
| Graphics Component | Designer | Lv2 | 25 |
| Brand Identity | Designer | Lv3 | 35 |
| Backend Code | Developer | Lv1 | 20 |
| Network Module | Developer | Lv2 | 30 |
| Security Protocol | Developer | Lv3 | 40 |

### Fase Implementasi

| Fase | Isi | Status |
|---|---|---|
| **A** | Backend state + UI dock tab REKRUT + campaign sourcing | ✅ Selesai |
| **B** | Algoritma negosiasi + dialog simulasi interaktif | ✅ Selesai |
| **C** | Desk indexing otomatis + level lock pada processWorkforces() + visual lock 🔒 | ⏳ |

---

## 2. Theme Color Fixes

### Dark Theme — Button Fixes

#### Masalah: `bg-ink text-white` tidak terbaca di dark mode
- `--color-ink` di dark mode = `#E4E7EB` (light gray)
- `text-white` = `#FFFFFF`
- Tombol seperti **Save** di HudBar: bg light gray + teks putih → hampir tidak terbaca

**Fix:**
- Tombol aksi utama (`bg-ink text-white`): ganti ke `bg-indigo text-white` (indigo konsisten di kedua tema)
- Atau tambah utility class `.btn-primary` dengan warna tetap di kedua tema

#### Speed Button Group — Dark Mode
- Container `bg-surface-2` di dark mode = `#242A33` (cukup kontras)
- Inactive button `text-ink-soft` = `#8A94A6` → ok
- **Tidak ada masalah berarti di dark mode** untuk speed button

### Light Theme — Speed Button Visibility

#### Masalah: Speed button group menyatu dengan background putih
- Container `bg-surface-2` = `#F8F9FB` (hampir putih)
- HudBar bg = `bg-surface` = `#FFFFFF`
- Border container = `#E3E7EE` (sangat tipis)
- Inactive button: teks `#667085` tanpa background → kurang visible

**Fix:**
- Container: tambah border lebih tebal/kontras atau ubah bg ke abu-abu lebih jelas
- Inactive button: kasih `hover:bg-surface-2` atau gunakan `text-ink` (bukan soft) untuk teks lebih gelap
- Opsi: container border `border-indigo/20` untuk aksen halus

### Perubahan File Lain

| File | Perubahan |
|---|---|
| `src/index.css` | Tambah utility `.btn-primary`, `.btn-ghost`; adjust kontras di dark |
| `src/components/HudBar.tsx` | Speed button container bg/border fix, Save button `bg-indigo` ganti `bg-ink` |
| `src/components/FloatingPanel.tsx` | Header button `hover:bg-ink/5` → CSS var aman |
| `src/components/ServerRoomView.tsx` | Sama |
| `src/components/MainMenu.tsx` | Update versi ke v1.3.3 |

---

## 3. Perubahan File (HR System)

| File | Perubahan |
|---|---|
| `src/types/employee.ts` | Tambah `SourcingCampaign`, `Applicant` interface |
| `src/types/index.ts` | Export baru |
| `src/store/gameStore.ts` | State: `sourcingCampaign`, `applicants`; actions: `startSourcing`, `reviewApplicant`, `negotiateSalary`, `hireApplicant`; proses sourcing di `incrementTick` |
| `src/systems/recruitment.ts` | BARU — logika sourcing campaign, generate applicant, negosiasi, level lock check |
| `src/components/RecruitmentPanel.tsx` | BARU — panel rekrutmen dengan campaign + list applicant + negosiasi |
| `src/components/Dock.tsx` | Tambah tombol REKRUT (`UserCheck` icon) |
| `src/systems/employee.ts` | `processWorkforces()` — validasi level lock sebelum assign task |
| `src/systems/saveLoad.ts` | Save/load `sourcingCampaign`, `applicants` |
| `src/db/gameDB.ts` | DB version 5 — tambah field baru |
| `src/components/MainMenu.tsx` | Update versi v1.3.3 |
| `docs/02_TASK.md` | Update checklist |

---

## 4. Checklist

### Theme Fixes
- [x] Fix `bg-ink text-white` di dark mode (HudBar Save button)
- [x] Fix speed button group visibility di light theme

### Fase A — Sourcing & Applicant
- [x] `SourcingCampaign` + `Applicant` types
- [x] Sourcing campaign (basic/pro/headhunter) dengan timer
- [x] Generate applicant random dengan atribut (level, speed, salary, mood)
- [x] UI panel rekrutmen + tab dock
- [x] Save/load support + DB v5
- [x] Hapus instant hire dari EmployeesPanel

### Fase B — Negosiasi Gaji
- [x] Logika negosiasi (mood-based: patient/stubborn/volatile)
- [x] Batas ronde negosiasi
- [x] UI input offer + tombol Tawar
- [x] Response kandidat (hired/rejected/countered)
- [x] Auto-hire ke employees saat deal

### Fase C — Level Lock & Desk Indexing
- [x] `minLevel` di ComponentDef + data komponen
- [x] `deskIndex` di Employee type
- [x] Desk indexing otomatis saat hire (cari slot kosong pertama)
- [x] Level lock filtering: `getAvailableComponents()` cek level
- [x] Visual lock 🔒 + required level badge di task buttons
- [x] OfficeGrid pakai `deskIndex` (bukan array index)
- [x] Main Menu versi v1.3.3
- [x] Build sukses (typecheck + lint)

---

## 5. Dev Mode (tetap)

Dev Panel & tombol `DEV` **tetap hanya di `npm run dev`** (`import.meta.env.DEV`).
