import { useState, useRef, useCallback } from 'react';
import { Star } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { getComponentDef } from '../data/components';
import { roleColor } from './CharacterAvatar';

const CELL_SIZE = 72;

function getStatusText(task: string | null): string {
  if (!task) return 'Idle';
  return task.replace(/_/g, ' ');
}

function getDeskClass(task: string | null, happiness: number): string {
  if (happiness < 15) return 'low';
  if (happiness < 30) return 'idle';
  if (task) return 'working';
  return 'idle';
}

export function OfficeGrid() {
  const employees = useGameStore((s) => s.employees);
  const focusEmployee = useGameStore((s) => s.focusEmployee);
  const moveEmployee = useGameStore((s) => s.moveEmployee);
  const darkMode = useGameStore((s) => s.darkMode);
  const officeGridCols = useGameStore((s) => s.officeGridCols);
  const officeGridRows = useGameStore((s) => s.officeGridRows);
  const gridRef = useRef<HTMLDivElement>(null);
  const [dragOverPos, setDragOverPos] = useState<{ x: number; y: number } | null>(null);
  const [draggedEmpId, setDraggedEmpId] = useState<string | null>(null);

  const getGridPos = useCallback((clientX: number, clientY: number) => {
    if (!gridRef.current) return null;
    const rect = gridRef.current.getBoundingClientRect();
    const x = Math.floor((clientX - rect.left) / CELL_SIZE);
    const y = Math.floor((clientY - rect.top) / CELL_SIZE);
    return { x: Math.max(0, Math.min(x, officeGridCols - 1)), y: Math.max(0, Math.min(y, officeGridRows - 1)) };
  }, [officeGridCols, officeGridRows]);

  const handleEmpDragStart = (e: React.DragEvent, empId: string) => {
    e.dataTransfer.setData('application/emp-id', empId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedEmpId(empId);
    const el = e.currentTarget as HTMLElement;
    setTimeout(() => el.style.opacity = '0.3', 0);
  };

  const handleEmpDragEnd = (e: React.DragEvent) => {
    const el = e.currentTarget as HTMLElement;
    el.style.opacity = '';
    setDragOverPos(null);
    setDraggedEmpId(null);
  };

  const handleGridDragOver = (e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes('application/emp-id')) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const pos = getGridPos(e.clientX, e.clientY);
    if (!pos) return;
    const collision = draggedEmpId && employees.some(emp => emp.id !== draggedEmpId && emp.gridX === pos.x && emp.gridY === pos.y);
    if (collision) return;
    setDragOverPos(pos);
  };

  const handleGridDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const empId = e.dataTransfer.getData('application/emp-id');
    if (!empId) return;
    const pos = getGridPos(e.clientX, e.clientY);
    if (!pos) return;
    const collision = employees.some(emp => emp.id !== empId && emp.gridX === pos.x && emp.gridY === pos.y);
    if (collision) return;
    moveEmployee(empId, pos.x, pos.y);
    setDragOverPos(null);
    setDraggedEmpId(null);
  };

  const totalCells = officeGridCols * officeGridRows;

  return (
    <div className="card p-5 flex-1">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-[18px] font-extrabold tracking-tight">Office Grid</h2>
          <p className="text-xs text-ink-soft mt-0.5">{employees.length} / {totalCells} meja terisi</p>
        </div>
      </div>

      <div className="relative pl-5 pb-5 flex justify-center">
        <div
          ref={gridRef}
          className={`relative border-2 rounded-lg transition-colors box-border ${dragOverPos ? 'border-indigo bg-indigo-soft/30' : 'border-border bg-surface'}`}
          style={{ width: officeGridCols * CELL_SIZE, height: officeGridRows * CELL_SIZE }}
          onDrop={handleGridDrop}
          onDragOver={handleGridDragOver}
          onDragLeave={() => setDragOverPos(null)}
        >
          {Array.from({ length: officeGridRows }, (_, row) =>
            Array.from({ length: officeGridCols }, (_, col) => (
              <div key={`${row}-${col}`} className="absolute border border-border/30"
                style={{ left: col * CELL_SIZE, top: row * CELL_SIZE, width: CELL_SIZE, height: CELL_SIZE }}
              />
            ))
          )}

          {Array.from({ length: officeGridCols }, (_, i) => (
            <div key={`cl${i}`} className="absolute -bottom-5 text-[9px] text-ink-soft font-mono text-center"
              style={{ left: i * CELL_SIZE, width: CELL_SIZE }}>{i}</div>
          ))}
          {Array.from({ length: officeGridRows }, (_, i) => (
            <div key={`rl${i}`} className="absolute -left-5 text-[9px] text-ink-soft font-mono leading-none"
              style={{ top: i * CELL_SIZE + 2, width: 16, textAlign: 'right' }}>{i}</div>
          ))}

          {dragOverPos && (
            <div className="absolute border-2 rounded-lg z-10 border-indigo bg-indigo/20 transition-all duration-100"
              style={{ left: dragOverPos.x * CELL_SIZE, top: dragOverPos.y * CELL_SIZE, width: CELL_SIZE, height: CELL_SIZE }}
            />
          )}

          {employees.map(emp => {
            const deskClass = getDeskClass(emp.currentTask, emp.happiness);
            const progress = emp.currentTask
              ? Math.min(100, Math.round((emp.taskProgress / (getComponentDef(emp.currentTask)?.baseTicks ?? 1)) * 100))
              : 0;

            const bgColorWorking = darkMode ? 'bg-green/20' : 'bg-green-soft';
            const borderColorWorking = darkMode ? 'border-green' : 'border-green';
            const bgColorLow = darkMode ? 'bg-red/20' : 'bg-red-soft';
            const borderColorLow = darkMode ? 'border-red' : 'border-red';
            const bgColorIdle = darkMode ? 'bg-surface-2' : 'bg-surface-2';
            const borderColorIdle = darkMode ? 'border-border' : 'border-border';

            const avatarColor = deskClass === 'working' ? (darkMode ? '#34D399' : '#17A366') : deskClass === 'low' ? (darkMode ? '#F87171' : '#D1453B') : (darkMode ? '#94A3B8' : '#4F5EFF');

            return (
              <div
                key={emp.id}
                draggable
                onDragStart={(e) => handleEmpDragStart(e, emp.id)}
                onDragEnd={handleEmpDragEnd}
                className={`absolute border rounded-lg transition-colors cursor-grab active:cursor-grabbing group box-border
                  ${emp.role === 'Lead_Developer' ? 'ring-2 ring-indigo/60' : ''}
                  ${deskClass === 'working' ? `${borderColorWorking} ${bgColorWorking}` :
                    deskClass === 'low' ? `${borderColorLow} ${bgColorLow}` :
                    `${borderColorIdle} ${bgColorIdle}`}`}
                style={{
                  left: emp.gridX * CELL_SIZE,
                  top: emp.gridY * CELL_SIZE,
                  width: CELL_SIZE - 4,
                  height: CELL_SIZE - 4,
                  margin: 2,
                  zIndex: draggedEmpId === emp.id ? 20 : 10,
                }}
                onClick={() => focusEmployee(emp.id)}
                title={`${emp.name} (${emp.role.replace('_', ' ')})${emp.supervisedBy ? ' (supervised)' : ''} - ${getStatusText(emp.currentTask)} - ${emp.happiness.toFixed(0)}% happiness`}
              >
                <div className="flex flex-col items-center justify-center h-full relative p-1">
                  <div className="w-[22px] h-[22px] rounded-md" style={{ backgroundColor: avatarColor, opacity: deskClass === 'idle' ? 0.55 : 1 }} />
                  <span className="text-[9px] font-semibold mt-1 truncate max-w-full px-0.5" style={{ color: roleColor(emp.role) }}>
                    {emp.name}
                  </span>
                  {emp.currentTask && (
                    <div className="absolute bottom-1 left-2 right-2 h-1 bg-ink/10 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo rounded-full transition-all duration-300 ease-out" style={{ width: `${progress}%` }} />
                    </div>
                  )}
                  {emp.happiness < 15 && (
                    <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red rounded-full animate-pulse z-10" title="Resign risk!" />
                  )}
                  {emp.role === 'Lead_Developer' && (
                    <Star className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 text-indigo drop-shadow z-20" strokeWidth={2.5} />
                  )}
                  {emp.supervisedBy && (
                    <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-indigo rounded-full z-10" title="Supervised" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
