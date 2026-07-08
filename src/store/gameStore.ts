import { create } from 'zustand';
import type { Employee, EmployeeRole, ComponentResource } from '../types';
import { getComponentDef, COMPONENTS } from '../data/components';

export type GameSpeed = 1 | 2 | 4;
export const TICKS_PER_MONTH = 30;

interface GameState {
  tick: number;
  isPaused: boolean;
  speed: GameSpeed;
  cash: number;
  month: number;
  employees: Employee[];
  resources: ComponentResource[];
  totalSalary: number;
  togglePause: () => void;
  setSpeed: (speed: GameSpeed) => void;
  incrementTick: () => void;
  addCash: (amount: number) => void;
  hireEmployee: (role: EmployeeRole) => void;
  assignTask: (employeeId: string, componentId: string) => void;
}

function calcTotalSalary(employees: Employee[]): number {
  return employees.reduce((sum, emp) => sum + emp.salary, 0);
}

const EMPLOYEE_NAMES: Record<EmployeeRole, string[]> = {
  Developer: ['Alice', 'Charlie', 'Eve', 'Frank', 'Grace', 'Henry', 'Ivy', 'Jack'],
  Designer: ['Bob', 'Diana', 'Fiona', 'George', 'Helen', 'Isaac', 'Julia', 'Kevin'],
  Lead_Developer: ['Mallory', 'Oscar', 'Peggy', 'Sam', 'Uma', 'Walter'],
  SysAdmin: ['Trent', 'Victor', 'Wendy', 'Xavier', 'Yara', 'Zane'],
};

export const useGameStore = create<GameState>((set, get) => ({
  tick: 0,
  isPaused: false,
  speed: 1,
  cash: 10000,
  month: 0,
  employees: [],
  resources: [],
  totalSalary: 0,

  togglePause: () => set((state) => ({ isPaused: !state.isPaused })),
  setSpeed: (speed) => set({ speed }),

  hireEmployee: (role: EmployeeRole) => {
    const state = get();
    const roleNames = EMPLOYEE_NAMES[role] || ['Unknown'];
    const roleCount = state.employees.filter(e => e.role === role).length;
    const name = roleNames[roleCount % roleNames.length];
    const id = `emp-${state.employees.length + 1}`;

    const newEmp: Employee = {
      id,
      name,
      role,
      level: 1,
      salary: 500,
      happiness: 80,
      speed: 1,
      currentTask: null,
      taskProgress: 0,
    };

    const updated = [...state.employees, newEmp];
    set({ employees: updated, totalSalary: calcTotalSalary(updated) });
  },

  assignTask: (employeeId: string, componentId: string) => {
    set((state) => ({
      employees: state.employees.map(emp =>
        emp.id === employeeId
          ? { ...emp, currentTask: componentId, taskProgress: 0 }
          : emp
      ),
    }));
  },

  incrementTick: () => {
    const state = get();
    const { tick, employees, resources } = state;
    const newTick = tick + 1;
    const newMonth = Math.floor(newTick / TICKS_PER_MONTH);
    const oldMonth = Math.floor(tick / TICKS_PER_MONTH);

    const newResources = resources.map(r => ({ ...r }));
    const newEmployees = employees.map(emp => {
      if (!emp.currentTask) return emp;
      const def = getComponentDef(emp.currentTask);
      if (!def) return emp;

      const newProgress = emp.taskProgress + emp.speed;
      if (newProgress >= def.baseTicks) {
        const existing = newResources.find(r => r.id === def.id);
        if (existing) {
          existing.quantity += 1;
        } else {
          newResources.push({ id: def.id, name: def.name, quantity: 1 });
        }
        return { ...emp, taskProgress: 0, currentTask: null };
      }
      return { ...emp, taskProgress: newProgress };
    });

    let cashChange = 0;
    let newTotalSalary = state.totalSalary;
    if (newMonth > oldMonth) {
      newTotalSalary = calcTotalSalary(newEmployees);
      cashChange = -newTotalSalary;
    }

    set({
      tick: newTick,
      month: newMonth,
      cash: state.cash + cashChange,
      totalSalary: newTotalSalary,
      employees: newEmployees,
      resources: newResources,
    });
  },

  addCash: (amount) => set((state) => ({ cash: state.cash + amount })),
}));

export function getComponentsByRole(role: EmployeeRole) {
  return COMPONENTS.filter(c => c.producedBy === role);
}
