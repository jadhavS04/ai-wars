import { create } from 'zustand';
import type { GameState, AgentAction } from '../engine/types';
import { createGame, stepGame, applyPlayerAction } from '../engine/gameEngine';

interface GameStore {
  state: GameState | null;
  initGame: (cityMode: GameState['cityMode'], mode: 'WATCH' | 'PLAY') => void;
  tick: () => void;
  setSpeed: (speed: 1 | 3 | 10) => void;
  setPaused: (paused: boolean) => void;
  playerAction: (action: AgentAction) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  state: null,

  initGame: (cityMode, mode) => {
    const newState = createGame(cityMode, mode);
    set({ state: { ...newState, mode } });
  },

  tick: () => {
    const { state } = get();
    if (!state) return;
    set({ state: stepGame(state) });
  },

  setSpeed: (speed) => {
    const { state } = get();
    if (!state) return;
    set({ state: { ...state, speed } });
  },

  setPaused: (paused) => {
    const { state } = get();
    if (!state) return;
    set({ state: { ...state, paused } });
  },

  playerAction: (action: AgentAction) => {
    const { state } = get();
    if (!state) return;
    set({ state: applyPlayerAction(state, action) });
  },

  resetGame: () => {
    set({ state: null });
  },
}));
