# Update V1.3.3 — Player Character, HR Role, Training & Level Lock

**Induk:** `docs/update_v1.3.2.md` (SysAdmin & Funding Rounds)
**Tujuan:** Player character system, HR role dengan recruitment boost, training system, level locking + perbaikan UI.

---

## 1. Player Character (CEO)

Setelah memilih produk, player masuk **PlayerSetup** screen — input username, lalu character dibuat:
- `isPlayer: true` — tidak bisa resign/dipecat
- Role dinamis: bisa diganti kapan aja via dropdown di EmployeeCard (Developer / Designer / HR)
- Tag `Owner` + icon Crown 👑
- **Overwork system**: jika happiness < 20 selama ≥50 tick kerja → speed -30%

### Alur
```
Main Menu → Pilih Produk → Input Username → Main Game
                                  ↓
                        Player character created:
                        name=username, role=Designer(default)
```

---

## 2. HR Role (Role ke-5)

`EmployeeRole` ditambah `'HR'`.

### HR Lead — Recruitment Boost
- Panel rekrutmen ada **dropdown** untuk pilih karyawan HR sebagai HR lead
- Campaign ticks: `baseTicks - (hrLevel × 30) - ⌊hrSpeed × 10⌋` (min 20 tick)
- Applicant quality: HR level meningkatkan distribusi level applicant
- Hanya 1 HR lead aktif dalam satu waktu

### HR Tidak Produksi Komponen
Role HR tidak punya component assignments — fokus ke recruitment support.

---

## 3. Training System

Setiap karyawan (non-player) bisa di-training:
- Tombol **Train** di EmployeeCard (muncul saat idle)
- Selama training: `isTraining = true`, tidak produksi komponen
- Progress bar kuning (amber), baseTicks = `level × 400`
- Selesai → level +1, notifikasi sukses
- Bisa cancel kapan aja (progress reset)

| Level | Training Duration |
|---|---|
| Lv1 | 400 ticks (20 day) |
| Lv2 | 800 ticks (40 day) |
| Lv3 | 1200 ticks (60 day) |

---

## 4. Struktur Data

```ts
// Employee — field baru
interface Employee {
  ...
  isPlayer: boolean;
  isTraining: boolean;
  trainingProgress: number;
  overworkTicks: number;
}
```

---

## 5. Level Locking

| Komponen | Role | Min Level |
|---|---|---|
| UI Component | Designer | Lv1 |
| Graphics Component | Designer | Lv2 |
| Brand Identity | Designer | Lv3 |
| Backend Code | Developer | Lv1 |
| Network Module | Developer | Lv2 |
| Security Protocol | Developer | Lv3 |

Komponen terkunci ditampilkan dengan icon 🔒 + badge "Lv.X" di EmployeeCard.

---

## 6. Perubahan File

| File | Perubahan |
|---|---|
| `types/employee.ts` | HR role, isPlayer, isTraining, trainingProgress, overworkTicks |
| `types/index.ts` | — (auto) |
| `store/gameStore.ts` | initPlayer, setPlayerRole, startTraining, cancelTraining, selectedHrId, setSelectedHr; HR boost di startSourcing & campaign tick; training progress + overwork di incrementTick |
| `systems/recruitment.ts` | getCampaignTicks(), rollLevelHR(), HR salary; applicantToEmployee dengan new fields |
| `data/components.ts` | — (sama) |
| `components/PlayerSetup.tsx` | **BARU** — input username |
| `components/EmployeesPanel.tsx` | Owner tag, role dropdown, training button, overwork warning, progress bar amber |
| `components/RecruitmentPanel.tsx` | HR lead selector dropdown + boost info |
| `components/CharacterAvatar.tsx` | HR color/icon definition |
| `App.tsx` | Routing PlayerSetup screen |
| `systems/saveLoad.ts` | Save selectedHrId |
| `db/gameDB.ts` | DB v6, field selectedHrId |
| `components/DevPanel.tsx` | Training cheat Lv+ button |
| `docs/update_v1.3.3.md` | Dokumen ini |

---

## 7. Checklist

### Player Character
- [x] PlayerSetup screen (username input)
- [x] Player character: isPlayer, cannot resign
- [x] Owner tag + Crown icon di EmployeeCard
- [x] Role dropdown dinamis (Developer/Designer/HR)
- [x] Overwork system (happiness < 20 selama 50 tick → speed -30%)

### HR Role
- [x] HR ditambah sebagai role ke-5
- [x] HR lead selector dropdown di RecruitmentPanel
- [x] Campaign ticks: getCampaignTicks(hrLevel, hrSpeed)
- [x] Applicant quality: rollLevelHR(hrLevel)
- [x] HR tidak punya component tasks

### Training System
- [x] startTraining / cancelTraining actions
- [x] Progress bar amber, baseTicks = level * 400
- [x] Cancel reset progress
- [x] Selesai → level +1, notifikasi

### Level Lock
- [x] minLevel di ComponentDef
- [x] getAvailableComponents / getLockedComponents
- [x] Visual lock 🔒 + badge Lv.X

### Tick System
- [x] 1 day = 20 ticks (TICKS_PER_DAY=20, TICKS_PER_MONTH=600)
- [x] HUD: full-width month progress bar + weekday/day/month/year display
- [x] Cash profit indicator (TrendingUp/TrendingDown hijau/merah)

### Lainnya
- [x] Save/load + DB v6
- [x] Build sukses (typecheck + lint)

---

## 8. Dev Mode (tetap)

Dev Panel & tombol `DEV` **tetap hanya di `npm run dev`** (`import.meta.env.DEV`).
