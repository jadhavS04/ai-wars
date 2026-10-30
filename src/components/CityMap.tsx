import { PERSONALITIES } from '../engine';
import type { Agent, GameEvent, World } from '../engine';

const SIZE = 600;
const C = SIZE / 2;
const RING = 212;
const TRACK = 2 * Math.PI * 19;

export function agentPos(slot: number, n: number) {
  const a = -Math.PI / 2 + (slot / n) * Math.PI * 2;
  return { x: C + Math.cos(a) * RING, y: C + Math.sin(a) * RING, angle: a };
}

const CRIME_KINDS = new Set(['punch', 'steal', 'arson']);

function Home({ agent, x, y }: { agent: Agent; x: number; y: number }) {
  const p = PERSONALITIES[agent.faction];
  const energy = Math.max(0, Math.min(100, agent.energy));
  const dead = !agent.alive;
  const wall = agent.homeBurnt ? '#3B3331' : dead ? '#B9C3C8' : '#FFFFFF';
  const roof = agent.homeBurnt ? '#241E1D' : dead ? '#9AA6AD' : p.color;
  return (
    <g className={`agent ${dead ? 'is-dead' : ''}`}>
      <title>
        {`${agent.name}, ${agent.job} (${p.name})\nEnergy ${Math.round(agent.energy)}  Credits ${agent.credits}\nCrimes ${agent.crimes}  Victim ${agent.victimized}${
          agent.homeBurnt ? '\nHome burnt' : ''
        }${dead ? `\nDied on day ${agent.diedOnDay}` : ''}`}
      </title>
      <rect x={x - 25} y={y - 15} width={50} height={36} rx={4} fill={wall} stroke="#13222C" strokeOpacity={0.25} />
      <polygon points={`${x - 29},${y - 14} ${x},${y - 36} ${x + 29},${y - 14}`} fill={roof} />
      {agent.homeBurnt && (
        <path
          className="flame"
          d={`M${x - 6},${y - 36} C${x - 14},${y - 48} ${x - 2},${y - 52} ${x - 3},${y - 62} C${x + 6},${y - 54} ${x + 12},${y - 48} ${x + 6},${y - 36} Z`}
          fill="#F2701D"
        />
      )}
      <circle cx={x} cy={y + 3} r={19} fill="none" stroke="#13222C" strokeOpacity={0.12} strokeWidth={4} />
      <circle
        cx={x}
        cy={y + 3}
        r={19}
        fill="none"
        stroke={energy < 25 ? '#C0392B' : p.color}
        strokeWidth={4}
        strokeLinecap="round"
        strokeDasharray={TRACK}
        strokeDashoffset={TRACK * (1 - energy / 100)}
        transform={`rotate(-90 ${x} ${y + 3})`}
        className="energy-ring"
      />
      <circle cx={x} cy={y + 3} r={12} fill={dead ? '#8C98A0' : p.color} stroke={agent.isHuman ? '#13222C' : 'none'} strokeWidth={2} />
      {dead && (
        <path d={`M${x - 6},${y - 3} L${x + 6},${y + 9} M${x + 6},${y - 3} L${x - 6},${y + 9}`} stroke="#fff" strokeWidth={2.5} strokeLinecap="round" />
      )}
      <text x={x} y={y + 44} textAnchor="middle" className="agent-name">
        {agent.isHuman ? `${agent.name} (you)` : agent.name}
      </text>
      <text x={x} y={y + 58} textAnchor="middle" className="agent-credits">
        {dead ? 'gone' : `${agent.credits} cr`}
      </text>
    </g>
  );
}

export function CityMap({ world, tick }: { world: World; tick: number }) {
  const n = world.agents.length;
  const crimes: GameEvent[] = world.lastStepEvents.filter(
    (e) => CRIME_KINDS.has(e.kind) && e.actor !== undefined && e.target !== undefined,
  );
  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="city-map" role="img" aria-label="Map of the city with each agent's home around the town hall">
      <circle cx={C} cy={C} r={RING + 52} className="map-ground" />
      {world.agents.map((a) => {
        const p = agentPos(a.slot, n);
        return <line key={`s${a.id}`} x1={C} y1={C} x2={p.x} y2={p.y} className="spoke" />;
      })}
      <circle cx={C} cy={C} r={58} className="hall" />
      <text x={C} y={C - 6} textAnchor="middle" className="hall-title">
        Town hall
      </text>
      <text x={C} y={C + 14} textAnchor="middle" className="hall-sub">
        {world.pool > 0 ? `${world.pool} cr voted` : 'awaiting votes'}
      </text>
      {world.agents.map((a) => {
        const p = agentPos(a.slot, n);
        return <Home key={a.id} agent={a} x={p.x} y={p.y} />;
      })}
      {crimes.map((e) => {
        const a = world.agents[e.actor as number];
        const b = world.agents[e.target as number];
        const pa = agentPos(a.slot, n);
        const pb = agentPos(b.slot, n);
        return (
          <line
            key={`${tick}-${e.id}`}
            x1={pa.x}
            y1={pa.y + 3}
            x2={pb.x}
            y2={pb.y + 3}
            className={`crime crime-${e.kind}`}
          />
        );
      })}
    </svg>
  );
}
