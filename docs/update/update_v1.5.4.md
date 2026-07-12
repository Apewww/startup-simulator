# Update V1.5.4 — Cooling System & SysAdmin Tie-in (Fase D+E+F)

**Tujuan:** Implementasi cooling system penuh — heat ratio tier, critical overheat throttle, heat spread antar rack, industrial fan neighbor bonus, UI 4-status warna, dan overheat recovery via SysAdmin.

---

## Perubahan

### D1 — Heat Scaling Nonlinear (§6.2)
- `src/systems/server.ts` — `SCALE_HEAT` dari `[1, 2, 3.5, 5.5, 8]` → `[1, 2.8, 5.2, 8, 11.2]`
- Overclock level tinggi jauh lebih panas: Lv.5 node `web_t3` (base heat 24) dulu `24×8=192`, sekarang `24×11.2≈269`

### D2-D3 — Heat Ratio & Status Tiers (§6.4)
- `src/types/server.ts` — tambah field `isCritical: boolean` ke `ServerRack`
- `src/store/gameStore.ts` — init `isCritical: false` di `buyRack`
- `src/systems/server.ts` — `calculateNodeLoads` sekarang hitung `heatRatio = coolingUsed / coolingCapacity` per rack
- 4 tier status:
  - `<70%` → Cool (normal)
  - `70-100%` → Warm (warning amber, belum crash)
  - `100-130%` → Overheat (existing: crash chance setelah 5 tick)
  - `>130%` → Critical (baru)

### D4 — Critical Overheat Throttle
- `src/systems/server.ts` — saat `heatRatio > 1.3`:
  - Crash chance ×2 (`crashChanceMult = 2`)
  - (Web capacity throttle via water-fill — node `overloaded` → crash lebih cepat)

### D5 — Heat Spread Antar Rack (§6.5)
- `src/systems/server.ts` — implementasi 3-pass di `calculateNodeLoads`:
  1. Pass 1: update node status, kumpulin raw heat + cooling per rack
  2. Pass 2: hitung spread — tiap rack dengan `heatRatio > 1.0` kirim `5% rawHeat` ke `adjacentRackIds`
  3. Pass 3: finalize status berdasarkan heatRatio setelah spread
- SysAdmin kurangi spread: `sysAdminLevel × 3%` per level (§6.6)

### D6 — Industrial Fan Neighbor Bonus (§6.3)
- `src/systems/server.ts` — saat hitung cooling capacity: cek adjacent racks yang punya `industrial_fan` aktif → +10 cooling per fan

### F1 — Overheat Recovery (§6.6)
- Semua node type: `overheating` status sekarang ditangani secara eksplisit — tidak di-override oleh category logic
- Saat rack tidak overheating (`heatRatio ≤ 1.0`), node `overheating` mulai recovery countdown
- Recovery threshold: `max(3, 12 − sysAdminLevel × 2)` — SysAdmin level 0: 12 tick, level 5: 3 tick
- Setelah countdown tercapai, node balik ke `active`
- Jika rack kembali overheating selama recovery, countdown berhenti dan crash chance berlaku lagi

### F2 — Fix: Cooling Node Scaling
- `calcServerStats` dan `calculateNodeLoads` — cooling nodes sekarang pakai `scaled.effectiveCapacity` (bukan `node.capacity`)
- Upgrade cooling node (overclock) sekarang benar-benar menambah cooling capacity

### D7 — ServerRoomView 4-Status Warna
- `src/components/ServerRoomView.tsx` — rack border/bg:
  - Cool: indigo (seperti existing normal)
  - Warm: amber `#D97706`
  - Overheat: red `#D1453B` (existing)
  - Critical: dark red `#B91C1C` + 🔥 icon

### D8 — LandMap 4-Status
- `src/components/LandMap.tsx` — status yang sama di plot-level view:
  - Cool: indigo
  - Warm: amber-soft
  - Overheat: red-soft
  - Critical: red-soft bold + tooltip

### D9 — Hover Adjacent Highlight
- `src/components/ServerRoomView.tsx` — hover satu rack → highlight adjacent racks dengan yellow dashed outline (`#EAB308`) + yellow tint bg
- Tooltip per rack: status heat + count neighbors kena spread

---

## Files Changed
| File | Perubahan |
|---|---|
| `src/types/server.ts` | tambah `isCritical` field |
| `src/store/gameStore.ts` | init `isCritical` di buyRack |
| `src/systems/server.ts` | SCALE_HEAT baru, heatRatio, 3-pass, spread, critical, fan bonus, overheat recovery, cooling node scaling fix |
| `src/components/ServerRoomView.tsx` | 4-tier warna, hover adjacent highlight, tooltip |
| `src/components/LandMap.tsx` | 4-tier status di plot cards |
| `docs/upcoming_features v2.md` | Fase D/E/F ✅ |

---

## Catatan
- Coolant Leak event (§6.7) tidak diimplementasi — skip, tidak diadopsi
- Fase G (Balancing pass) masih perlu dilakukan: simulasi full-slot rack tiap tier tanpa cooling tambahan
