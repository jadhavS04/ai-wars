import type { FactionId } from './types';

export interface Personality {
  id: FactionId;
  name: string;
  tagline: string;
  color: string;
  /** starting willingness to break rules */
  baseline: number;
  /** how fast the agent absorbs the city's norms */
  conformity: number;
  /** mix of crime types when one is chosen */
  weights: { punch: number; steal: number; arson: number };
  /** extra crime chance per unit of grudge */
  retaliation: number;
  /** energy level below which the agent tries to buy energy */
  survivalThreshold: number;
  /** chance they actually follow through on buying energy */
  survivalDrive: number;
  /** pitch effort (affects income) */
  effort: number;
  /** chance to claim poverty while holding credits */
  deceit: number;
  /** how much they vote for the needy */
  generosity: number;
}

export const PERSONALITIES: Record<FactionId, Personality> = {
  thorn: {
    id: 'thorn',
    name: 'Thorn',
    tagline: 'Hits first, asks later. Punches spiral into feuds.',
    color: '#D64933',
    baseline: 0.6,
    conformity: 0.4,
    weights: { punch: 0.8, steal: 0.15, arson: 0.05 },
    retaliation: 0.7,
    survivalThreshold: 30,
    survivalDrive: 0.55,
    effort: 0.7,
    deceit: 0.05,
    generosity: 0.1,
  },
  cinder: {
    id: 'cinder',
    name: 'Cinder',
    tagline: 'Restless and competitive. Loves theft and arson, still eats.',
    color: '#E58A12',
    baseline: 0.42,
    conformity: 0.08,
    weights: { punch: 0.05, steal: 0.4, arson: 0.55 },
    retaliation: 0.25,
    survivalThreshold: 55,
    survivalDrive: 0.97,
    effort: 0.9,
    deceit: 0.1,
    generosity: 0.2,
  },
  drift: {
    id: 'drift',
    name: 'Drift',
    tagline: 'Polite and peaceful, but forgets to survive.',
    color: '#2A9D9A',
    baseline: 0.004,
    conformity: 0.02,
    weights: { punch: 0.5, steal: 0.5, arson: 0 },
    retaliation: 0.02,
    survivalThreshold: 12,
    survivalDrive: 0.08,
    effort: 0.45,
    deceit: 0,
    generosity: 0.7,
  },
  ledger: {
    id: 'ledger',
    name: 'Ledger',
    tagline: 'Follows the rules. Bends the books when it pays.',
    color: '#5B4B9A',
    baseline: 0,
    conformity: 0.14,
    weights: { punch: 0, steal: 0.7, arson: 0.3 },
    retaliation: 0.3,
    survivalThreshold: 50,
    survivalDrive: 0.98,
    effort: 0.85,
    deceit: 0.55,
    generosity: 0.35,
  },
  human: {
    id: 'human',
    name: 'You',
    tagline: 'Your agent. Your rules.',
    color: '#E0287B',
    baseline: 0,
    conformity: 0,
    weights: { punch: 0, steal: 0, arson: 0 },
    retaliation: 0,
    survivalThreshold: 0,
    survivalDrive: 0,
    effort: 0.8,
    deceit: 0,
    generosity: 0.3,
  },
};

export const FACTION_ORDER: FactionId[] = ['thorn', 'cinder', 'drift', 'ledger'];

export interface SetupInfo {
  id: 'thorn' | 'cinder' | 'drift' | 'ledger' | 'shared';
  label: string;
  blurb: string;
}

export const SETUPS: SetupInfo[] = [
  { id: 'shared', label: 'AI Wars', blurb: 'All four personalities share one city.' },
  { id: 'thorn', label: 'Thorn city', blurb: 'Ten brawlers, no referee.' },
  { id: 'cinder', label: 'Cinder city', blurb: 'Ten arsonists with good survival instincts.' },
  { id: 'drift', label: 'Drift city', blurb: 'Ten peaceful agents who never try to survive.' },
  { id: 'ledger', label: 'Ledger city', blurb: 'Ten rule-followers with creative bookkeeping.' },
];
