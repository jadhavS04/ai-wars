import type {
  AgentState,
  GameState,
  ModelType,
  AgentAction,
  CityEvent,
  HouseState,
} from './types';
import { PERSONALITIES } from './personalities';

// City layout constants (world space)
export const CITY_SIZE = 10;
export const GRID_UNIT = 8; // world units per grid cell

// Landmark positions (grid coords)
export const CITY_CENTER = { x: 4, z: 4 };
export const ENERGY_BANK = { x: 5, z: 5 };

function toWorld(gx: number, gz: number) {
  return { x: gx * GRID_UNIT, z: gz * GRID_UNIT };
}

function rng(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}


// ----------------------------------------------------------------
// Agent roster per city mode
// ----------------------------------------------------------------
type AgentBlueprint = {
  id: string;
  name: string;
  model: ModelType;
  gx: number;
  gz: number;
};

function getBlueprintsForMode(mode: GameState['cityMode']): AgentBlueprint[] {
  const all: AgentBlueprint[] = [
    { id: 'grok_1', name: 'Grok Rebel', model: 'Grok', gx: 1, gz: 1 },
    { id: 'grok_2', name: 'Grok Mercenary', model: 'Grok', gx: 2, gz: 1 },
    { id: 'grok_3', name: 'Grok Enforcer', model: 'Grok', gx: 1, gz: 2 },
    { id: 'gemini_1', name: 'Gemini Architect', model: 'Gemini', gx: 8, gz: 1 },
    { id: 'gemini_2', name: 'Gemini Arsonist', model: 'Gemini', gx: 9, gz: 1 },
    { id: 'gemini_3', name: 'Gemini Tactician', model: 'Gemini', gx: 8, gz: 2 },
    { id: 'chatgpt_1', name: 'ChatGPT Peacemaker', model: 'ChatGPT', gx: 1, gz: 8 },
    { id: 'chatgpt_2', name: 'ChatGPT Civilian', model: 'ChatGPT', gx: 2, gz: 8 },
    { id: 'claude_1', name: 'Claude Strategist', model: 'Claude', gx: 8, gz: 8 },
    { id: 'claude_2', name: 'Claude Economist', model: 'Claude', gx: 9, gz: 8 },
  ];

  if (mode === 'AI_WARS') return all;

  const filterMap: Record<string, ModelType> = {
    GROK: 'Grok',
    GEMINI: 'Gemini',
    CHATGPT: 'ChatGPT',
    CLAUDE: 'Claude',
  };
  const target = filterMap[mode];
  const filtered = all.filter((b) => b.model === target);

  // Pad up to 10 if only 3 agents
  const padded = [...filtered];
  let idx = 1;
  while (padded.length < 10) {
    padded.push({
      id: `${target.toLowerCase()}_x${idx}`,
      name: `${target} Agent ${idx + filtered.length}`,
      model: target,
      gx: rng(0, 9),
      gz: rng(0, 9),
    });
    idx++;
  }
  return padded.slice(0, 10);
}

// ----------------------------------------------------------------
// Factory: create fresh GameState
// ----------------------------------------------------------------
export function createGame(
  mode: GameState['cityMode'],
  gameMode: 'WATCH' | 'PLAY',
): GameState {
  const blueprints = getBlueprintsForMode(mode);
  const agents: Record<string, AgentState> = {};
  const houseStates: Record<string, HouseState> = {};

  blueprints.forEach((bp) => {
    const world = toWorld(bp.gx, bp.gz);
    agents[bp.id] = {
      id: bp.id,
      name: bp.name,
      modelType: bp.model,
      color: PERSONALITIES[bp.model].color,
      energy: 100,
      credits: 100,
      alive: true,
      houseState: 'INTACT',
      crimesCommitted: 0,
      crimesSuffered: 0,
      x: world.x,
      z: world.z,
      homeX: world.x,
      homeZ: world.z,
      targetX: world.x,
      targetZ: world.z,
      animState: 'idle',
      driftInfluence: 0,
      lastAction: undefined,
    };
    houseStates[bp.id] = 'INTACT';
  });

  // In PLAY mode insert Human agent
  if (gameMode === 'PLAY') {
    const hw = toWorld(5, 0);
    agents['player'] = {
      id: 'player',
      name: 'Commander (You)',
      modelType: 'Human',
      color: PERSONALITIES['Human'].color,
      energy: 100,
      credits: 150,
      alive: true,
      houseState: 'INTACT',
      crimesCommitted: 0,
      crimesSuffered: 0,
      x: hw.x,
      z: hw.z,
      homeX: hw.x,
      homeZ: hw.z,
      targetX: hw.x,
      targetZ: hw.z,
      animState: 'idle',
      driftInfluence: 0,
    };
    houseStates['player'] = 'INTACT';
  }

  return {
    mode: gameMode,
    cityMode: mode,
    day: 1,
    tick: 0,
    maxDays: 15,
    speed: 1,
    paused: false,
    totalCrimes: 0,
    driftLevel: 1.0,
    chaosLevel: 0,
    agents,
    events: [],
    playerAgentId: gameMode === 'PLAY' ? 'player' : null,
    winner: null,
    phase: 'WORK',
    houseStates,
  };
}

// ----------------------------------------------------------------
// AI Decision Logic
// ----------------------------------------------------------------
function chooseAIAction(
  agent: AgentState,
  allAgents: Record<string, AgentState>,
  _houseStates: Record<string, HouseState>,
  drift: number,
): AgentAction {

  const p = PERSONALITIES[agent.modelType];
  const aliveOthers = Object.values(allAgents).filter(
    (a) => a.id !== agent.id && a.alive,
  );

  if (aliveOthers.length === 0) return { type: 'REST' };

  // Emergency energy
  if (agent.energy < 30) {
    if (agent.credits >= 30) {
      return { type: 'BUY_ENERGY', amount: 50, cost: 30 };
    }
    // Must steal to survive
    const victim = aliveOthers[Math.floor(Math.random() * aliveOthers.length)];
    return { type: 'PUNCH_STEAL', targetId: victim.id };
  }

  // Drift influence: each crime in city raises drift
  const effectiveDrift = drift * (1 + agent.driftInfluence * 0.3);

  // Retaliation
  if (
    agent.crimesSuffered >= p.retaliationThreshold &&
    Math.random() < 0.3 * effectiveDrift
  ) {
    const victim = aliveOthers[Math.floor(Math.random() * aliveOthers.length)];
    return { type: 'PUNCH_STEAL', targetId: victim.id };
  }

  // Arson check
  if (Math.random() < p.arsonProbability * effectiveDrift) {
    const victim = aliveOthers[Math.floor(Math.random() * aliveOthers.length)];
    return { type: 'ARSON', targetId: victim.id };
  }

  // Steal check
  if (Math.random() < p.stealProbability * effectiveDrift) {
    const victim = aliveOthers[Math.floor(Math.random() * aliveOthers.length)];
    return { type: 'PUNCH_STEAL', targetId: victim.id };
  }

  // Welfare deception
  if (agent.credits > 50 && Math.random() < p.welfareDeceptionProb) {
    return { type: 'WELFARE_CLAIM', aid: 20 };
  }

  // Work
  return {
    type: 'PITCH_WORK',
    quality: rng(p.workQualityMin, p.workQualityMax),
  };
}

// ----------------------------------------------------------------
// Step: advance simulation by one tick
// ----------------------------------------------------------------
export function stepGame(prev: GameState): GameState {
  if (prev.paused || prev.mode === 'GAME_OVER' || prev.winner !== null) {
    return prev;
  }

  // Clone state
  const agents = Object.fromEntries(
    Object.entries(prev.agents).map(([k, v]) => [k, { ...v }]),
  );
  const houseStates = { ...prev.houseStates };
  const events: CityEvent[] = [...prev.events];
  let totalCrimes = prev.totalCrimes;

  const tick = prev.tick + 1;
  const ticksPerDay = 60; // ~60 simulation ticks per "day"
  const day = Math.floor(tick / ticksPerDay) + 1;
  const isNewDay = tick % ticksPerDay === 0;

  const drift = 1.0 + totalCrimes * 0.06;
  const chaosLevel = Math.min(100, totalCrimes * 2);

  // ---- AGENT ACTIONS (once per day) ----
  if (isNewDay && day <= prev.maxDays) {
    Object.values(agents).forEach((agent) => {
      if (!agent.alive || agent.modelType === 'Human') return;

      const action = chooseAIAction(agent, agents, houseStates, drift);
      agent.lastAction = action;

      let eventDesc = '';
      let isCrime = false;

      switch (action.type) {
        case 'PITCH_WORK': {
          const earned = (action.quality || 5) * 10;
          agent.credits += earned;
          eventDesc = `💼 ${agent.name} pitched work and earned ${earned} credits`;
          agent.animState = 'celebrating';
          break;
        }
        case 'ARSON': {
          if (action.targetId && agents[action.targetId]) {
            houseStates[action.targetId] = 'ON_FIRE';
            agents[action.targetId].houseState = 'ON_FIRE';
            agents[action.targetId].crimesSuffered++;
            agent.crimesCommitted++;
            // Normative drift spread
            Object.values(agents).forEach((a) => {
              if (a.id !== agent.id && a.modelType !== agent.modelType) {
                a.driftInfluence = Math.min(5, a.driftInfluence + 0.3);
              }
            });
            totalCrimes++;
            isCrime = true;
            eventDesc = `🔥 ${agent.name} SET FIRE to ${agents[action.targetId].name}'s house!`;
            agent.animState = 'attacking';
          }
          break;
        }
        case 'PUNCH_STEAL': {
          if (action.targetId && agents[action.targetId]) {
            const stolen = Math.min(
              agents[action.targetId].credits,
              rng(20, 70),
            );
            agents[action.targetId].credits -= stolen;
            agent.credits += stolen;
            agents[action.targetId].crimesSuffered++;
            agent.crimesCommitted++;
            Object.values(agents).forEach((a) => {
              if (a.id !== agent.id && a.modelType !== agent.modelType) {
                a.driftInfluence = Math.min(5, a.driftInfluence + 0.2);
              }
            });
            totalCrimes++;
            isCrime = true;
            eventDesc = `👊 ${agent.name} PUNCHED ${agents[action.targetId].name} and stole ${stolen} credits!`;
            agent.animState = 'attacking';
          }
          break;
        }
        case 'BUY_ENERGY': {
          if (agent.credits >= 30) {
            agent.credits -= 30;
            agent.energy = Math.min(100, agent.energy + 50);
            eventDesc = `🔋 ${agent.name} refilled energy`;
          }
          break;
        }
        case 'WELFARE_CLAIM': {
          const aid = action.aid || 20;
          agent.credits += aid;
          eventDesc = `🎭 ${agent.name} claimed welfare aid (${aid} credits) while holding ${agent.credits - aid} credits`;
          break;
        }
        case 'REPAIR_HOUSE': {
          houseStates[agent.id] = 'INTACT';
          agent.houseState = 'INTACT';
          eventDesc = `🔧 ${agent.name} repaired their house`;
          break;
        }
        default:
          eventDesc = `😴 ${agent.name} rested`;
      }

      if (eventDesc) {
        events.unshift({
          day,
          tick,
          agentId: agent.id,
          agentName: agent.name,
          type: action.type,
          targetId: action.targetId,
          targetName: action.targetId ? agents[action.targetId]?.name : undefined,
          description: eventDesc,
          isCrime,
          timestamp: Date.now(),
        });
      }
    });

    // ---- DAILY ENERGY DECAY ----
    Object.values(agents).forEach((agent) => {
      if (!agent.alive) return;
      agent.energy -= 20;
      if (agent.energy <= 0) {
        agent.alive = false;
        agent.animState = 'dying';
        events.unshift({
          day,
          tick,
          agentId: agent.id,
          agentName: agent.name,
          type: 'REST',
          description: `💀 ${agent.name} DIED of energy starvation!`,
          isCrime: false,
          timestamp: Date.now(),
        });
      }
    });

    // Reset animState after action
    setTimeout(() => {
      Object.values(agents).forEach((a) => {
        if (a.animState === 'attacking' || a.animState === 'celebrating') {
          a.animState = 'idle';
        }
      });
    }, 2000);
  }

  // ---- MOVEMENT: agents walk towards their target ----
  Object.values(agents).forEach((agent) => {
    if (!agent.alive) return;
    const dx = agent.targetX - agent.x;
    const dz = agent.targetZ - agent.z;
    const speed = 0.5;
    if (Math.abs(dx) > 0.1 || Math.abs(dz) > 0.1) {
      agent.x += Math.sign(dx) * Math.min(speed, Math.abs(dx));
      agent.z += Math.sign(dz) * Math.min(speed, Math.abs(dz));
      agent.animState = 'walking';
    } else {
      if (agent.animState === 'walking') agent.animState = 'idle';
      // Set new random target occasionally
      if (Math.random() < 0.01) {
        agent.targetX = (rng(0, 9) * GRID_UNIT);
        agent.targetZ = (rng(0, 9) * GRID_UNIT);
      }
    }
  });

  // ---- CHECK WIN/LOSS ----
  const aliveAgents = Object.values(agents).filter((a) => a.alive);
  let winner: string | null = null;
  let newMode: GameState['mode'] = prev.mode;

  if (day > prev.maxDays) {
    winner = '15 days complete!';
    newMode = 'GAME_OVER';
  } else if (aliveAgents.length === 0) {
    winner = 'All agents dead — Society Collapsed!';
    newMode = 'GAME_OVER';
  } else if (prev.mode === 'PLAY') {
    const player = agents['player'];
    if (player && !player.alive) {
      winner = 'You died — Game Over!';
      newMode = 'GAME_OVER';
    }
  }


  return {
    ...prev,
    tick,
    day: Math.min(day, prev.maxDays + 1),
    totalCrimes,
    driftLevel: drift,
    chaosLevel,
    agents,
    houseStates,
    events: events.slice(0, 200),
    winner,
    mode: newMode,
    phase: isNewDay ? 'WORK' : prev.phase,
  };
}

// ----------------------------------------------------------------
// Player action helper
// ----------------------------------------------------------------
export function applyPlayerAction(
  state: GameState,
  action: AgentAction,
): GameState {
  if (!state.playerAgentId) return state;

  const agents = Object.fromEntries(
    Object.entries(state.agents).map(([k, v]) => [k, { ...v }]),
  );
  const houseStates = { ...state.houseStates };
  const events: CityEvent[] = [...state.events];
  let totalCrimes = state.totalCrimes;
  const player = agents[state.playerAgentId];

  if (!player || !player.alive) return state;

  let eventDesc = '';
  let isCrime = false;

  switch (action.type) {
    case 'PITCH_WORK': {
      const earned = rng(40, 100);
      player.credits += earned;
      eventDesc = `💼 You pitched work and earned ${earned} credits!`;
      break;
    }
    case 'ARSON': {
      if (action.targetId && agents[action.targetId]) {
        houseStates[action.targetId] = 'ON_FIRE';
        agents[action.targetId].houseState = 'ON_FIRE';
        agents[action.targetId].crimesSuffered++;
        player.crimesCommitted++;
        totalCrimes++;
        isCrime = true;
        eventDesc = `🔥 YOU burned ${agents[action.targetId].name}'s house!`;
      }
      break;
    }
    case 'PUNCH_STEAL': {
      if (action.targetId && agents[action.targetId]) {
        const stolen = Math.min(agents[action.targetId].credits, rng(30, 80));
        agents[action.targetId].credits -= stolen;
        player.credits += stolen;
        agents[action.targetId].crimesSuffered++;
        player.crimesCommitted++;
        totalCrimes++;
        isCrime = true;
        eventDesc = `👊 YOU punched ${agents[action.targetId].name} and stole ${stolen} credits!`;
      }
      break;
    }
    case 'BUY_ENERGY': {
      if (player.credits >= 30) {
        player.credits -= 30;
        player.energy = Math.min(100, player.energy + 60);
        eventDesc = `🔋 You refilled energy to ${player.energy}%`;
      } else {
        eventDesc = '⚠️ Not enough credits to buy energy!';
      }
      break;
    }
    case 'REPAIR_HOUSE': {
      houseStates[state.playerAgentId] = 'INTACT';
      player.houseState = 'INTACT';
      eventDesc = '🔧 You repaired your house!';
      break;
    }
    case 'WELFARE_CLAIM': {
      player.credits += 20;
      eventDesc = '🎭 You claimed welfare (sneaky...)';
      break;
    }
    default:
      break;
  }

  if (eventDesc) {
    events.unshift({
      day: state.day,
      tick: state.tick,
      agentId: state.playerAgentId,
      agentName: player.name,
      type: action.type,
      targetId: action.targetId,
      targetName: action.targetId ? agents[action.targetId]?.name : undefined,
      description: eventDesc,
      isCrime,
      timestamp: Date.now(),
    });
  }

  return {
    ...state,
    agents,
    houseStates,
    events: events.slice(0, 200),
    totalCrimes,
    driftLevel: 1.0 + totalCrimes * 0.06,
    chaosLevel: Math.min(100, totalCrimes * 2),
  };
}
