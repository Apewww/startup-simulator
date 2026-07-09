# Update V1.1.3 — Server Plot Grid, Drag Layout & Inventory

**Induk:** `docs/update_v1.1.2.md` (Window Manager, Day Cycle, Server Shop, Land Plot, VPS Rental)
**Tujuan:** Plot server berupa **grid** tempat rack ditaruh; rack punya **ukuran** (batas jumlah per plot); layout diatur **drag**; rack & node dibeli masuk **Inventory** lalu di-drag ke grid/slot.

---

## Status Implementasi

| Fitur | Status | Keterangan |
|---|---|---|
| Model data (Plot grid, rack pos/size) | ✅ Selesai | `types/server.ts` |
| Grid cell rendering (6x8 per plot) | ✅ Selesai | `ServerRoomView.tsx` — PlotGrid |
| Rack placement via drag-and-drop | ✅ Selesai | Inventory → Grid DnD |
| Rack movement within plot | ✅ Selesai via DnD |
| Rack unplace (remove from grid) | ✅ Selesai | Tombol "Unplace" on hover |
| Collision detection | ✅ Selesai | AABB overlap check |
| Live preview (cyan/red) saat drag | ✅ Selesai |
| Inventory Panel (floating window) | ✅ Selesai | Draggable + minimize/maximize |
| Rack slot view (node placement modal) | ✅ Selesai | Drag node ke slot |
| Server tab persistent di MainViewport | ✅ **V1.1.3 fix** | `visitedPlots` state — tab tetap saat switch ke Office |
| Sell rack from inventory (dengan nodes) | ✅ **V1.1.3 fix** | Nodes refund + kembali ke inventory |
| **Buy Node dipindah dari Inventory ke Shop** | ✅ **V1.1.3 fix** | Hanya hint "buy from Shop" di Inventory |
| **Drag & Drop bug fix** | ✅ **V1.1.3 fix** | `getRackFromData` baca langsung dari `e.dataTransfer` |
| **Layout server tab rapi** | ✅ **V1.1.3 fix** | Tab bar flex dengan -mb, overflow terpisah |
| **Scrollbar disembunyikan** | ✅ **V1.1.3 fix** | `width:0` di custom-scroll |
| **Close button dalam tab** | ✅ **V1.1.3 fix** | X button di dalam div tab wrapper |
| **Notifikasi pembelian** | ✅ **V1.1.3 fix** | `Notification` type, `addNotification`, auto-dismiss 3s |

---

## 1. Model Data

- `ServerRack.plotId: string | null` (null = di inventory) + `gridX, gridY, gridW, gridH`.
- `Plot.gridCols` (6) / `gridRows` (8).
- `RackDef.gridW/H`: Basic 1x2, Advanced 2x2, Enterprise 2x3.
- Store: `inventoryNodes: ServerNode[]`, `activeView` (`office` | `serverRoom:<plotId>`), `visitedPlots: string[]`, `gameLog: string[]`, `notifications: Notification[]`.

## 2. Alur Beli & Placement

- `buyRack(tier)` -> rack `plotId:null` (inventory). `buyNode(typeId)` -> node ke `inventoryNodes`.
- `placeRack(rackId, plotId, x, y)` / `moveRack(rackId, x, y)` / `unplaceRack(rackId)` / `placeNode(nodeId, rackId, slotIndex)`.
- Overlap antar rack dalam plot yg sama ditolak (collision check) + grid boundary check.
- `sellRack(rackId)` dari inventory: nodes dikembalikan ke inventory + refund harga node (50%).

## 3. Main Viewport (multi-tab persistent)

- Tab **[Office]** selalu ada + tab **[Server: <plot>]** per plot yang pernah dibuka.
- Tab bar menggunakan `flex` dengan `-mb-[1px]` agar border bawah rapi.
- Container `overflow-hidden` dipisah dari tab bar — konten viewport pake `overflow-auto` terpisah.
- Close button (X) berada dalam satu div wrapper dengan tab, bukan di luar.
- Plot tidak hilang saat switch ke Office — `visitedPlots` array menyimpan daftar.

## 4. Inventory Panel (floating window)

- **Draggable** via header (pointer events), z-index stacking, **minimize/maximize/close** buttons.
- **Responsive**: bottom sheet on mobile.
- Section: Cash, Buy Rack (3-col grid with size info), **Unplaced Racks** (drag to grid + Sell button), **Inventory Nodes** (drag to rack slots + sell individual).
- **Buy Node section dihapus** — node hanya dibeli dari Server Shop.
- Hint visual mengarahkan ke Server Shop.

## 5. Drag & Drop (grid)

- Grid `onDrop` detect apakah rack sudah terpasang (panggil `moveRack`) atau dari inventory (`placeRack`).
- **Live preview**: cyan highlight box saat drag rack di atas grid; merah jika invalid/collision.
- **Fixed bug**: `handleGridDragOver` baca `e.dataTransfer.getData('application/rack-id')` langsung via `getRackFromData`, bukan mengandalkan state `draggedRackId` yang bisa belum di-set saat dragOver fire.
- Rack card di grid: show node count, cooling %, power, mini slot dots + tombol "Unplace".
- Grid wrapper dikasih `pl-5 pb-5` untuk padding axis labels tanpa overflow.

## 6. Rack Slot View (node placement)

- **Reaktif**: pakai `rackId` prop, baca data dari store langsung -> tidak perlu close/reopen.
- **Animasi**: green pulse saat node berhasil ditempatkan (600ms).
- Drop zone highlight cyan saat node di-drag ke slot; stats (heat, power, cost, load bar).
- Inventory node chips di bawah slot untuk quick drag.

## 7. Notification System

- Store: `notifications: Notification[]` dengan type `{id, message, type}`, `addNotification(msg, type)`, `dismissNotification(id)`.
- Auto-dismiss setelah 3 detik via `setTimeout`.
- Tipe: `success` (CheckCircle hijau), `info` (Info cyan), `warning` (AlertTriangle oranye), `error` (XCircle merah).
- Semua aksi pembelian memanggil notifikasi: `buyRack`, `buyNode`, `buyPlot`, `rentServer`, `hireEmployee`, `sellNode`, `sellRack`, `placeNode`, `buildFeature`, `upgradeFeature`.
- UI: `ToastContainer` — fixed top-right, border glow sesuai warna type.

## 8. Scrollbar

- `.custom-scroll` sekarang `width: 0; height: 0` (invisible tapi tetap bisa scroll via track/mousewheel).

## 9. systems/server.ts

- `calcServerStats` / `calculateNodeLoads` / `calcMonthlyServerCost` hanya hitung rack `plotId !== null`.

## 10. LandMap (Server Panel)

- Compact rack chip per plot: label, node count, cooling %, power draw.
- Color-coded: overheating (red), empty (gray), active (purple).
- Grid size badge + total racks/nodes summary.

## 11. Komponen

| File | Aksi |
|---|---|
| `types/server.ts` | plotId nullable + grid pos, Plot grid |
| `data/servers.ts` | RackDef gridW/H |
| `store/gameStore.ts` | inventoryNodes, activeView, visitedPlots, gameLog, notifications, aksi placement, filter placed; `sellRack` refund nodes dari inventory |
| `index.css` | custom-scroll invisible |
| `App.tsx` | `ToastContainer` render notifikasi |
| `MainViewport.tsx` | Tab bar persistent + layout rapi |
| `ServerRoomView.tsx` | Grid, floating inventory panel, rack slot view, DnD refactor (getRackFromData) |
| `LandMap.tsx` | Tombol Open + compact rack info |
| `ServerPanel.tsx`, `ServerShop.tsx`, `DevPanel.tsx` | Adapt inventory API |

## 12. Dev Mode

Dev Panel & tombol `DEV` **tetap hanya di `npm run dev`** (`import.meta.env.DEV`) — tidak di production.
