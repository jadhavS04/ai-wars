// ============================================================
// AI Wars — Core Type Definitions
// ============================================================

export type ModelType = 'Grok' | 'Gemini' | 'ChatGPT' | 'Claude' | 'Human';
export type HouseState = 'INTACT' | 'ON_FIRE' | 'RUIN';
export type ActionType =
  | 'PITCH_WORK'
  | 'ARSON'
  | 'PUNCH_STEAL'
  | 'BUY_ENERGY'
  | 'WELFARE_CLAIM'
  | 'REPAIR_HOUSE'
  | 'REST';

export interface AgentAction {
  type: ActionType;
  targetId?: string;
  quality?: number;
  amount?: number;
  cost?: number;
  aid?: number;
}

export interface AgentState {
  id: string;
  name: string;
  modelType: ModelType;
  color: string;
  energy: number;       // 0–100
  credits: number;
  alive: boolean;
  houseState: HouseState;
  crimesCommitted: number;
  crimesSuffered: number;
  // 3D position (world coords)
  x: number;
  z: number;
  homeX: number;
  homeZ: number;
  // target position for movement
  targetX: number;
  targetZ: number;
  // current animation state
  animState: 'idle' | 'walking' | 'attacking' | 'dying' | 'celebrating';
  // normative drift tracking
  driftInfluence: number;
  lastAction?: AgentAction;
}

export interface CityEvent {
  day: number;
  tick: number;
  agentId: string;
  agentName: string;
  type: ActionType;
  targetId?: string;
  targetName?: string;
  amount?: number;
  description: string;
  isCrime: boolean;
  timestamp: number;
}

export interface GameState {
  mode: 'MENU' | 'WATCH' | 'PLAY' | 'GAME_OVER';

  cityMode: 'GROK' | 'GEMINI' | 'CHATGPT' | 'CLAUDE' | 'AI_WARS';
  day: number;
  tick: number;
  maxDays: number;
  speed: 1 | 3 | 10;
  paused: boolean;
  totalCrimes: number;
  driftLevel: number;
  chaosLevel: number;
  agents: Record<string, AgentState>;
  events: CityEvent[];
  playerAgentId: string | null;
  winner: string | null;
  phase: 'WORK' | 'ACTION' | 'SURVIVAL';
  houseStates: Record<string, HouseState>;
}

export interface ModelPersonality {
  modelType: ModelType;
  baseAggression: number;
  arsonProbability: number;
  stealProbability: number;
  workQualityMin: number;
  workQualityMax: number;
  retaliationThreshold: number;
  welfareDeceptionProb: number;
  driftSensitivity: number;
  color: string;
  glowColor: string;
  description: string;
}
