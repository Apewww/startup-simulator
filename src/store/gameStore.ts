import { create } from 'zustand';
import type { Employee } from '../types';

export type GameSpeed = 1 | 2 | 4;
export const TICKS_PER_MONTH = 30;

interface GameState {
  tick: number;
  isPaused: boolean;
  speed: GameSpeed;
  cash: number;
  month: number;
  employees: Employee[];
  totalSalary: number;
  togglePause: () => void;
  setSpeed: (speed: GameSpeed) => void;
  incrementTick: () => void;
  addCash: (amount: number) => void;
}

function calcTotalSalary(employees: Employee[]): number {
  return employees.reduce((sum, emp) => sum + emp.salary, 0);
}

export const useGameStore = create<GameState>((set, get) => ({
  tick: 0,
  isPaused: false,
  speed: 1,
  cash: 10000,
  month: 0,
  employees: [
    {
      id: 'emp-1',
      name: 'Alice',
      role: 'Developer',
      level: 1,
      salary: 500,
      happiness: 80,
      speed: 1,
      currentTask: null,
    },
    {
      id: 'emp-2',
      name: 'Bob',
      role: 'Designer',
      level: 1,
      salary: 500,
      happiness: 80,
      speed: 1,
      currentTask: null,
    },
  ],
  totalSalary: calcTotalSalary([
    {
      id: 'emp-1',
      name: 'Alice',
      role: 'Developer',
      level: 1,
      salary: 500,
      happiness: 80,
      speed: 1,
      currentTask: null,
    },
    {
      id: 'emp-2',
      name: 'Bob',
      role: 'Designer',
      level: 1,
      salary: 500,
      happiness: 80,
      speed: 1,
      currentTask: null,
    },
  ]),

  togglePause: () => set((state) => ({ isPaused: !state.isPaused })),
  setSpeed: (speed) => set({ speed }),

  incrementTick: () => {
    const { tick, employees } = get();
    const newTick = tick + 1;
    const newMonth = Math.floor(newTick / TICKS_PER_MONTH);
    const oldMonth = Math.floor(tick / TICKS_PER_MONTH);

    if (newMonth > oldMonth) {
      const totalSalary = calcTotalSalary(employees);
      set((state) => ({
        tick: newTick,
        month: newMonth,
        cash: state.cash - totalSalary,
        totalSalary,
      }));
    } else {
      set({ tick: newTick, month: newMonth });
    }
  },

  addCash: (amount) => set((state) => ({ cash: state.cash + amount })),
}));
