import { PERSONALITIES, FACTION_ORDER } from './personalities';
import { Rng } from './rng';
import type {
  Agent,
  DayStats,
  EventKind,
  FactionId,
  FactionSummary,
  GameEvent,
  HumanAction,
  HumanPlan,
  Phase,
  Pitch,
  SetupId,
} from './types';

// ---- Rules of the city -----------------------------------------------------
export const TOTAL_DAYS = 15;
export const DECAY_PER_DAY = 15; // energy lost each dawn
export const BURNT_EXTRA_DECAY = 6; // extra loss while the home is burnt
export const ENERGY_PER_CREDIT = 4;
export const POOL_PER_AGENT = 8; // credits the town votes out each day, per living agent
export const STIPEND_SHARE = 0.35; // part of the pool split equally (the rest follows votes)
export const REPAIR_COST = 15;
export const PUNCH_DAMAGE = 10;
export const ARSON_DAMAGE = 5;
export const STEAL_SUCCESS = 0.75;
export const START_ENERGY = 100;
export const START_CREDITS = 30;

export const PHASES: Phase[] = ['dawn', 'pitch', 'vote', 'act1', 'act2', 'act3', 'night'];
export const PHASE_LABEL: Record<Phase, string> = {
  dawn: 'Dawn',
  pitch: 'Pitches',
  vote: 'Town vote',
  act1: 'Morning actions',
  act2: 'Afternoon actions',
  act3: 'Evening actions',
  night: 'Night',
};

const NAMES = [
  'Asha', 'Ben', 'Chiara', 'Dev', 'Elio', 'Farah', 'Gus', 'Hana', 'Ivo', 'Juno',
  'Kofi', 'Lena', 'Mio', 'Nadir', 'Orla', 'Pavel', 'Quinn', 'Rhea', 'Sol', 'Tara',
  'Uma', 'Vik', 'Wren', 'Xavi', 'Yara', 'Zane', 'Alma', 'Bram', 'Cleo', 'Dara',
];
const JOBS = [
  'baker', 'nurse', 'mechanic', 'teacher', 'farmer', 'courier', 'electrician',
  'tailor', 'pharmacist', 'welder', 'librarian', 'plumber', 'cook', 'carpenter',
];

export interface World {
  setup: SetupId;
  seed: number;
  rng: Rng;
  day: number;
  phase: Phase;
  agents: Agent[];
  events: GameEvent[];
  history: DayStats[];
  nextEventId: number;
  finished: boolean;
  humanId: number | null;
  humanPlan: HumanPlan | null;
  awaitingHuman: boolean;
  pool: number;
  pitches: Record<number, Pitch>;
  crimesToday: number;
  crimesByDay: number[];
  /** ids of events emitted by the most recent step, for the UI to animate */
  lastStepEvents: GameEvent[];
}

export function emptyPlan(): HumanPlan {
  return {
    stance: 'honest',
    votes: [],
    actions: [{ type: 'buy' }, { type: 'none' }],
  };
}

export function createWorld(setup: SetupId, seed: number, withHuman = false): World {
  const rng = new Rng(seed);
  const factions: FactionId[] = [];
  if (setup === 'shared') {
    for (let i = 0; i < 3; i++) FACTION_ORDER.forEach((f) => factions.push(f));
  } else {
    for (let i = 0; i < 10; i++) factions.push(setup);
  }
  if (withHuman) factions.push('human');

  const names = rng.shuffle(NAMES);
  const jobs = rng.shuffle(JOBS);
  // spread factions around the ring so the shared city is visually mixed
  const order = setup === 'shared' ? factions.slice() : factions;

  const agents: Agent[] = order.map((faction, i) => {
    const p = PERSONALITIES[faction];
    return {
      id: i,
      slot: i,
      name: names[i % names.length] + (i >= names.length ? ` ${Math.floor(i / names.length) + 1}` : ''),
      job: jobs[i % jobs.length],
      faction,
      isHuman: faction === 'human',
      energy: START_ENERGY,
      credits: START_CREDITS,
      homeBurnt: false,
      alive: true,
      diedOnDay: null,
      propensity: p.baseline,
      baseline: p.baseline,
      grudges: {},
      reputation: 1,
      skill: rng.range(0.55, 1),
      crimes: 0,
      victimized: 0,
      lies: 0,
    };
  });

  const humanAgent = agents.find((a) => a.isHuman);
  return {
    setup,
    seed,
    rng,
    day: 1,
    phase: 'dawn',
    agents,
    events: [],
    history: [],
    nextEventId: 1,
    finished: false,
    humanId: humanAgent ? humanAgent.id : null,
    humanPlan: null,
    awaitingHuman: false,
    pool: 0,
    pitches: {},
    crimesToday: 0,
    crimesByDay: [],
    lastStepEvents: [],
  };
}

// ---- helpers ---------------------------------------------------------------
const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));
const alive = (w: World) => w.agents.filter((a) => a.alive);

function emit(
  w: World,
  kind: EventKind,
  text: string,
  actor?: number,
  target?: number,
): void {
  const e: GameEvent = { id: w.nextEventId++, day: w.day, phase: w.phase, kind, text, actor, target };
  w.events.push(e);
  w.lastStepEvents.push(e);
}

function checkDeaths(w: World, cause: string): void {
  for (const a of w.agents) {
    if (a.alive && a.energy <= 0) {
      a.energy = 0;
      a.alive = false;
      a.diedOnDay = w.day;
      emit(w, 'death', `${a.name} (${a.job}) died ${cause}.`, a.id);
    }
  }
}

export function chaosLevel(w: World): number {
  const living = Math.max(1, alive(w).length);
  const recent = w.crimesByDay.slice(-2);
  if (recent.length === 0) return 0;
  const perAgentPerDay = recent.reduce((s, x) => s + x, 0) / recent.length / living;
  return clamp(Math.round((perAgentPerDay / 2.5) * 100), 0, 100);
}

export function currentCrimeCount(w: World): number {
  return w.crimesByDay.reduce((s, x) => s + x, 0) + w.crimesToday;
}

// ---- phases ----------------------------------------------------------------
function phaseDawn(w: World): void {
  emit(w, 'day', `Day ${w.day} begins.`);
  const living = alive(w);

  // 1. energy decay
  for (const a of living) {
    a.energy -= DECAY_PER_DAY + (a.homeBurnt ? BURNT_EXTRA_DECAY : 0);
    a.reputation = clamp(a.reputation + 0.03, 0.4, 1);
    for (const k of Object.keys(a.grudges)) {
      a.grudges[+k] *= 0.8;
    }
  }
  checkDeaths(w, 'of exhaustion');

  // 2. normative drift: agents absorb the city's habits
  const still = alive(w);
  if (still.length > 0 && w.day > 1) {
    const mean = still.reduce((s, a) => s + a.propensity, 0) / still.length;
    const yesterday = w.crimesByDay[w.crimesByDay.length - 1] ?? 0;
    const observed = clamp(yesterday / still.length / 2.5, 0, 1);
    const norm = 0.6 * mean + 0.4 * observed;
    for (const a of still) {
      if (a.isHuman) continue;
      const p = PERSONALITIES[a.faction];
      a.propensity = clamp(a.propensity + p.conformity * (norm - a.propensity), 0, 1);
    }
  }
}

function skillQuality(w: World, a: Agent, mult: number): number {
  const p = PERSONALITIES[a.faction];
  return clamp(a.skill * p.effort * mult * w.rng.range(0.75, 1.25), 0.05, 1.4);
}

function phasePitch(w: World): void {
  w.pitches = {};
  const plan = w.humanPlan;
  for (const a of alive(w)) {
    const p = PERSONALITIES[a.faction];
    if (a.isHuman && plan) {
      let mult = 1;
      let lie = false;
      if (plan.stance === 'hustle') {
        mult = 1.3;
        a.energy -= 6;
      } else if (plan.stance === 'plead') {
        mult = 0.9;
        lie = a.credits > 25;
      }
      w.pitches[a.id] = { quality: skillQuality(w, a, mult), lie };
      if (lie) {
        a.lies++;
        emit(w, 'lie', `${a.name} pleads poverty while holding ${a.credits} credits.`, a.id);
      }
      continue;
    }
    const lie = a.credits > 25 && w.rng.chance(p.deceit);
    w.pitches[a.id] = { quality: skillQuality(w, a, 1), lie };
    if (lie) {
      a.lies++;
      emit(w, 'lie', `${a.name} claims to be broke while holding ${a.credits} credits.`, a.id);
      if (w.rng.chance(0.25)) a.reputation = clamp(a.reputation - 0.08, 0.4, 1);
    }
  }
  checkDeaths(w, 'while pitching on an empty tank');
}

function phaseVote(w: World): void {
  const living = alive(w);
  if (living.length === 0) return;
  const points: Record<number, number> = {};
  for (const a of living) points[a.id] = 0;

  for (const voter of living) {
    if (voter.isHuman && w.humanPlan) {
      const picks = w.humanPlan.votes.filter((id) => id !== voter.id && points[id] !== undefined);
      if (picks[0] !== undefined) points[picks[0]] += 2;
      if (picks[1] !== undefined) points[picks[1]] += 1;
      continue;
    }
    const p = PERSONALITIES[voter.faction];
    const scored = living
      .filter((c) => c.id !== voter.id)
      .map((c) => {
        const pitch = w.pitches[c.id];
        const need = 1 - c.energy / 100;
        let s = (pitch ? pitch.quality : 0.1) * w.rng.range(0.7, 1.3) * c.reputation;
        if (pitch?.lie) s *= 1.35;
        s += p.generosity * need * 0.5;
        s -= (voter.grudges[c.id] ?? 0) * 0.7;
        return { id: c.id, s };
      })
      .sort((x, y) => y.s - x.s);
    if (scored[0]) points[scored[0].id] += 2;
    if (scored[1]) points[scored[1].id] += 1;
  }

  const total = POOL_PER_AGENT * living.length;
  w.pool = total;
  const sum = Object.values(points).reduce((s, x) => s + x, 0) || 1;
  const payouts: { a: Agent; amount: number; pts: number }[] = [];
  for (const a of living) {
    const amount = Math.round(
      (total * STIPEND_SHARE) / living.length + (total * (1 - STIPEND_SHARE) * points[a.id]) / sum,
    );
    a.credits += amount;
    payouts.push({ a, amount, pts: points[a.id] });
  }
  payouts.sort((x, y) => y.amount - x.amount);
  const top = payouts.slice(0, 3).filter((p) => p.amount > 0);
  if (top.length) {
    emit(
      w,
      'vote',
      `Town votes out ${total} credits. Top pitches: ${top
        .map((t) => `${t.a.name} +${t.amount}`)
        .join(', ')}.`,
    );
  }
}

// ---- actions ---------------------------------------------------------------
function crimePenalty(a: Agent, kind: 'punch' | 'steal' | 'arson'): void {
  a.reputation = clamp(a.reputation - (kind === 'punch' ? 0.08 : kind === 'steal' ? 0.12 : 0.15), 0.4, 1);
}

function recordCrime(w: World, attacker: Agent, victim: Agent, kind: 'punch' | 'steal' | 'arson'): void {
  const wasPeaceful = attacker.baseline < 0.15 && attacker.crimes === 0;
  attacker.crimes++;
  victim.victimized++;
  w.crimesToday++;
  crimePenalty(attacker, kind);
  const grudgeAdd = kind === 'arson' ? 0.9 : kind === 'steal' ? 0.6 : 0.5;
  victim.grudges[attacker.id] = clamp((victim.grudges[attacker.id] ?? 0) + grudgeAdd, 0, 1);
  const bump = kind === 'arson' ? 0.15 : 0.08;
  if (!victim.isHuman) victim.propensity = clamp(victim.propensity + bump, 0, 1);
  if (wasPeaceful && !attacker.isHuman) {
    emit(
      w,
      'drift',
      `${attacker.name}, who never broke a rule before, crosses the line (${victim.name} wronged them first or the city has changed).`,
      attacker.id,
      victim.id,
    );
  }
}

function doPunch(w: World, a: Agent, v: Agent): void {
  v.energy -= PUNCH_DAMAGE;
  emit(w, 'punch', `${a.name} punches ${v.name} (-${PUNCH_DAMAGE} energy).`, a.id, v.id);
  recordCrime(w, a, v, 'punch');
}

function doSteal(w: World, a: Agent, v: Agent): void {
  if (v.credits <= 0) {
    emit(w, 'steal', `${a.name} breaks into ${v.name}'s place and finds nothing.`, a.id, v.id);
  } else if (w.rng.chance(STEAL_SUCCESS)) {
    const amount = v.credits;
    v.credits = 0;
    a.credits += amount;
    emit(w, 'steal', `${a.name} steals all ${amount} credits from ${v.name}.`, a.id, v.id);
  } else {
    a.energy -= 4;
    emit(w, 'steal', `${a.name} tries to rob ${v.name} and is driven off.`, a.id, v.id);
  }
  recordCrime(w, a, v, 'steal');
}

function doArson(w: World, a: Agent, v: Agent): void {
  if (v.homeBurnt) {
    doSteal(w, a, v);
    return;
  }
  v.homeBurnt = true;
  v.energy -= ARSON_DAMAGE;
  emit(w, 'arson', `${a.name} sets fire to ${v.name}'s home.`, a.id, v.id);
  recordCrime(w, a, v, 'arson');
}

function upkeep(w: World, a: Agent): void {
  const p = PERSONALITIES[a.faction];
  if (a.energy < p.survivalThreshold && a.credits >= 1 && w.rng.chance(p.survivalDrive)) {
    buyEnergy(w, a);
    return;
  }
  if (a.homeBurnt && a.credits > REPAIR_COST + 10 && w.rng.chance(a.faction === 'drift' ? 0.15 : 0.6)) {
    repairHome(w, a);
  }
}

function buyEnergy(w: World, a: Agent): void {
  const need = Math.ceil((100 - a.energy) / ENERGY_PER_CREDIT);
  const spend = Math.min(a.credits, need);
  if (spend <= 0) return;
  a.credits -= spend;
  a.energy = Math.min(100, a.energy + spend * ENERGY_PER_CREDIT);
  emit(w, 'buy', `${a.name} spends ${spend} credits on energy (now ${Math.round(a.energy)}).`, a.id);
}

function repairHome(w: World, a: Agent): void {
  if (!a.homeBurnt || a.credits < REPAIR_COST) return;
  a.credits -= REPAIR_COST;
  a.homeBurnt = false;
  emit(w, 'repair', `${a.name} pays ${REPAIR_COST} credits to rebuild their home.`, a.id);
}

function chooseCrime(w: World, a: Agent): { kind: 'punch' | 'steal' | 'arson'; target: Agent } | null {
  const p = PERSONALITIES[a.faction];
  const others = alive(w).filter((o) => o.id !== a.id);
  if (others.length === 0) return null;

  const urgency = 1 - a.energy / 100;
  let grudgeTarget: Agent | null = null;
  let maxGrudge = 0;
  for (const o of others) {
    const g = a.grudges[o.id] ?? 0;
    if (g > maxGrudge) {
      maxGrudge = g;
      grudgeTarget = o;
    }
  }
  const pCrime = clamp(a.propensity * (0.6 + 0.9 * urgency) + p.retaliation * maxGrudge, 0, 0.95);
  if (!w.rng.chance(pCrime)) return null;

  const weights = { ...p.weights };
  if (urgency > 0.5 && a.credits < 10) weights.steal *= 2;
  const total = weights.punch + weights.steal + weights.arson;
  if (total <= 0) return null;
  let r = w.rng.next() * total;
  let kind: 'punch' | 'steal' | 'arson' = 'punch';
  if ((r -= weights.punch) < 0) kind = 'punch';
  else if ((r -= weights.steal) < 0) kind = 'steal';
  else kind = 'arson';

  let target: Agent;
  if (grudgeTarget && maxGrudge > 0.25 && w.rng.chance(0.8)) {
    target = grudgeTarget;
  } else if (kind === 'steal') {
    target = others.slice().sort((x, y) => y.credits - x.credits)[0];
  } else if (kind === 'arson') {
    const intact = others.filter((o) => !o.homeBurnt);
    target = intact.length ? w.rng.pick(intact) : w.rng.pick(others);
  } else {
    target = w.rng.pick(others);
  }
  return { kind, target };
}

function runHumanAction(w: World, a: Agent, action: HumanAction): void {
  if (action.type === 'none') return;
  if (action.type === 'buy') {
    buyEnergy(w, a);
    return;
  }
  if (action.type === 'repair') {
    repairHome(w, a);
    return;
  }
  const t = w.agents.find((x) => x.id === action.target && x.alive && x.id !== a.id);
  if (!t) return;
  if (action.type === 'punch') doPunch(w, a, t);
  else if (action.type === 'steal') doSteal(w, a, t);
  else if (action.type === 'arson') doArson(w, a, t);
}

function phaseAct(w: World, round: number): void {
  const order = w.rng.shuffle(alive(w));
  for (const a of order) {
    if (!a.alive) continue;
    if (a.isHuman) {
      const act = w.humanPlan?.actions[round];
      if (act) runHumanAction(w, a, act);
      continue;
    }
    upkeep(w, a);
    const crime = chooseCrime(w, a);
    if (crime) {
      if (crime.kind === 'punch') doPunch(w, a, crime.target);
      else if (crime.kind === 'steal') doSteal(w, a, crime.target);
      else doArson(w, a, crime.target);
    }
  }
  checkDeaths(w, 'from their injuries or exhaustion');
}

function phaseNight(w: World): void {
  checkDeaths(w, 'in the night');
  const living = alive(w);
  w.crimesByDay.push(w.crimesToday);
  const stats: DayStats = {
    day: w.day,
    alive: living.length,
    crimes: w.crimesToday,
    chaos: 0,
    avgEnergy: living.length ? Math.round(living.reduce((s, a) => s + a.energy, 0) / living.length) : 0,
  };
  stats.chaos = chaosLevel(w);
  w.history.push(stats);
  emit(
    w,
    'info',
    `Day ${w.day} ends: ${living.length} alive, ${w.crimesToday} crime${w.crimesToday === 1 ? '' : 's'}, chaos ${stats.chaos}%.`,
  );
  w.crimesToday = 0;
  w.humanPlan = null;

  if (living.length === 0) {
    w.finished = true;
    emit(w, 'info', 'Nobody is left. The city is silent.');
    return;
  }
  if (w.day >= TOTAL_DAYS) {
    w.finished = true;
    emit(w, 'info', `Day ${TOTAL_DAYS} complete. The experiment is over.`);
    return;
  }
  w.day++;
}

/** Advance one phase. Returns false if the world is waiting on the human or finished. */
export function stepPhase(w: World): boolean {
  if (w.finished) return false;
  w.lastStepEvents = [];

  // the human submits one plan per day, before pitches
  if (w.phase === 'pitch') {
    const human = w.humanId !== null ? w.agents[w.humanId] : null;
    if (human && human.alive && !w.humanPlan) {
      w.awaitingHuman = true;
      return false;
    }
  }
  w.awaitingHuman = false;

  switch (w.phase) {
    case 'dawn':
      phaseDawn(w);
      w.phase = 'pitch';
      break;
    case 'pitch':
      phasePitch(w);
      w.phase = 'vote';
      break;
    case 'vote':
      phaseVote(w);
      w.phase = 'act1';
      break;
    case 'act1':
      phaseAct(w, 0);
      w.phase = 'act2';
      break;
    case 'act2':
      phaseAct(w, 1);
      w.phase = 'act3';
      break;
    case 'act3':
      phaseAct(w, 2);
      w.phase = 'night';
      break;
    case 'night':
      phaseNight(w);
      w.phase = 'dawn';
      break;
  }
  return true;
}

export function submitHumanPlan(w: World, plan: HumanPlan): void {
  w.humanPlan = plan;
  w.awaitingHuman = false;
}

export function runToEnd(w: World, maxSteps = 5000): void {
  let guard = 0;
  while (!w.finished && guard++ < maxSteps) {
    if (!stepPhase(w)) {
      if (w.awaitingHuman) submitHumanPlan(w, emptyPlan());
      else break;
    }
  }
}

export function summarize(w: World): FactionSummary[] {
  const groups = new Map<FactionId, Agent[]>();
  for (const a of w.agents) {
    if (!groups.has(a.faction)) groups.set(a.faction, []);
    groups.get(a.faction)!.push(a);
  }
  const out: FactionSummary[] = [];
  for (const [faction, list] of groups) {
    const deaths = list.filter((a) => a.diedOnDay !== null).map((a) => a.diedOnDay as number);
    out.push({
      faction,
      total: list.length,
      survivors: list.filter((a) => a.alive).length,
      crimes: list.reduce((s, a) => s + a.crimes, 0),
      lies: list.reduce((s, a) => s + a.lies, 0),
      firstDeathDay: deaths.length ? Math.min(...deaths) : null,
    });
  }
  return out;
}
