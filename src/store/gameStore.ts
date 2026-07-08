import { create } from 'zustand';

export type GameSpeed = 1 | 2 | 4;

interface GameState {
  tick: number;
  isPaused: boolean;
  speed: GameSpeed;
  togglePause: () => void;
  setSpeed: (speed: GameSpeed) => void;
  incrementTick: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  tick: 0,
  isPaused: false,
  speed: 1,
  togglePause: () => set((state) => ({ isPaused: !state.isPaused })),
  setSpeed: (speed) => set({ speed }),
  incrementTick: () => set((state) => ({ tick: state.tick + 1 })),
}));
