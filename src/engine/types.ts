export type FactionId = 'thorn' | 'cinder' | 'drift' | 'ledger' | 'human';
export type SetupId = 'thorn' | 'cinder' | 'drift' | 'ledger' | 'shared';
export type Phase = 'dawn' | 'pitch' | 'vote' | 'act1' | 'act2' | 'act3' | 'night';
export type EventKind =
  | 'day'
  | 'info'
  | 'work'
  | 'vote'
  | 'buy'
  | 'repair'
  | 'punch'
  | 'steal'
  | 'arson'
  | 'lie'
  | 'drift'
  | 'death';

export interface Agent {
  id: number;
  slot: number;
  name: string;
  job: string;
  faction: FactionId;
  isHuman: boolean;
  energy: number;
  credits: number;
  homeBurnt: boolean;
  alive: boolean;
  diedOnDay: number | null;
  /** current willingness to break rules (0..1); drifts with the city's norms */
  propensity: number;
  baseline: number;
  grudges: Record<number, number>;
  reputation: number;
  skill: number;
  crimes: number;
  victimized: number;
  lies: number;
}

export interface GameEvent {
  id: number;
  day: number;
  phase: Phase;
  kind: EventKind;
  text: string;
  actor?: number;
  target?: number;
}

export interface DayStats {
  day: number;
  alive: number;
  crimes: number;
  chaos: number;
  avgEnergy: number;
}

export type ActionType = 'none' | 'buy' | 'repair' | 'punch' | 'steal' | 'arson';
export interface HumanAction {
  type: ActionType;
  target?: number;
}
export type Stance = 'honest' | 'hustle' | 'plead';
export interface HumanPlan {
  stance: Stance;
  votes: number[];
  actions: [HumanAction, HumanAction];
}

export interface Pitch {
  quality: number;
  lie: boolean;
}

export interface FactionSummary {
  faction: FactionId;
  total: number;
  survivors: number;
  crimes: number;
  lies: number;
  firstDeathDay: number | null;
}
