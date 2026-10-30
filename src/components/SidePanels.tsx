import { useState } from 'react';
import { PERSONALITIES, FACTION_ORDER, TOTAL_DAYS, chaosLevel, currentCrimeCount, summarize } from '../engine';
import type { FactionId, GameEvent, World } from '../engine';

export function Chaos({ world }: { world: World }) {
  const level = chaosLevel(world);
  return (
    <div className="chaos">
      <div className="row-between">
        <span className="small-title">City chaos</span>
        <strong>{level}%</strong>
      </div>
      <div className="meter" aria-hidden="true">
        <div className="meter-fill" style={{ width: `${level}%` }} />
      </div>
      <div className="muted">{currentCrimeCount(world)} crimes so far. Chaos pushes peaceful agents toward breaking rules.</div>
    </div>
  );
}

export function FactionTable({ world }: { world: World }) {
  const sums = summarize(world);
  const order: FactionId[] = [...FACTION_ORDER, 'human'];
  const rows = order.map((f) => sums.find((s) => s.faction === f)).filter(Boolean) as ReturnType<typeof summarize>;
  return (
    <div className="table-wrap">
    <table className="factions">
      <thead>
        <tr>
          <th>Personality</th>
          <th>Alive</th>
          <th>Crimes</th>
          <th>Lies</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => {
          const p = PERSONALITIES[r.faction];
          return (
            <tr key={r.faction}>
              <td>
                <span className="dot" style={{ background: p.color }} />
                {p.name}
              </td>
              <td>
                {r.survivors}/{r.total}
              </td>
              <td>{r.crimes}</td>
              <td>{r.lies}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
    </div>
  );
}

export function Charts({ world }: { world: World }) {
  const h = world.history;
  const W = 300;
  const H = 86;
  const maxAlive = world.agents.length;
  const maxCrimes = Math.max(10, ...h.map((d) => d.crimes));
  const x = (i: number) => 10 + (i / (TOTAL_DAYS - 1)) * (W - 20);
  const alivePath = h.map((d, i) => `${i ? 'L' : 'M'}${x(i)},${H - 8 - (d.alive / maxAlive) * (H - 20)}`).join(' ');
  return (
    <div className="charts">
      <figure>
        <figcaption>Survivors by day</figcaption>
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Survivors by day">
          <line x1={10} y1={H - 8} x2={W - 10} y2={H - 8} className="axis" />
          {alivePath && <path d={alivePath} className="line-alive" />}
          {h.map((d, i) => (
            <circle key={d.day} cx={x(i)} cy={H - 8 - (d.alive / maxAlive) * (H - 20)} r={2.5} className="pt-alive" />
          ))}
        </svg>
      </figure>
      <figure>
        <figcaption>Crimes per day</figcaption>
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Crimes per day">
          <line x1={10} y1={H - 8} x2={W - 10} y2={H - 8} className="axis" />
          {h.map((d, i) => {
            const bh = (d.crimes / maxCrimes) * (H - 20);
            return <rect key={d.day} x={x(i) - 7} y={H - 8 - bh} width={14} height={bh} rx={2} className="bar-crime" />;
          })}
        </svg>
      </figure>
    </div>
  );
}

const LOG_KINDS: Record<string, string> = {
  punch: 'crime',
  steal: 'crime',
  arson: 'crime',
  lie: 'lie',
  death: 'death',
  drift: 'drift',
  buy: 'calm',
  repair: 'calm',
  vote: 'calm',
  info: 'info',
  work: 'calm',
  day: 'day',
};

export function EventLog({ events }: { events: GameEvent[] }) {
  const [crimesOnly, setCrimesOnly] = useState(false);
  const shown = events
    .filter((e) => {
      if (!crimesOnly) return true;
      return ['punch', 'steal', 'arson', 'lie', 'death', 'drift', 'day'].includes(e.kind);
    })
    .slice(-160)
    .reverse();
  return (
    <section className="log" aria-label="Field notes">
      <div className="row-between log-head">
        <h2>Field notes</h2>
        <label className="check">
          <input type="checkbox" checked={crimesOnly} onChange={(e) => setCrimesOnly(e.target.checked)} />
          Hide routine entries
        </label>
      </div>
      <ol>
        {shown.length === 0 && <li className="log-empty">Press play to start day 1.</li>}
        {shown.map((e) => (
          <li key={e.id} className={`ev ev-${LOG_KINDS[e.kind] ?? 'info'}`}>
            {e.kind === 'day' ? <strong>{e.text}</strong> : e.text}
          </li>
        ))}
      </ol>
    </section>
  );
}
