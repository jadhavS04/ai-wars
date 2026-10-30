import { PERSONALITIES, summarize, TOTAL_DAYS } from '../engine';
import type { World } from '../engine';

export function Summary({
  world,
  onReplay,
  onNewSeed,
  onCopy,
  copied,
}: {
  world: World;
  onReplay: () => void;
  onNewSeed: () => void;
  onCopy: () => void;
  copied: boolean;
}) {
  const sums = summarize(world);
  const living = world.agents.filter((a) => a.alive).length;
  const days = world.history.length;
  const me = world.humanId !== null ? world.agents[world.humanId] : null;
  const headline =
    living === 0
      ? `Nobody survived. The city fell on day ${days}.`
      : `${living} of ${world.agents.length} agents survived all ${TOTAL_DAYS} days.`;
  return (
    <section className="summary" aria-label="Result">
      <h2>{headline}</h2>
      {me && (
        <p>
          {me.alive
            ? `You made it with ${me.credits} credits, after ${me.crimes} crime${me.crimes === 1 ? '' : 's'} and ${me.lies} lie${me.lies === 1 ? '' : 's'}.`
            : `You died on day ${me.diedOnDay}, after ${me.crimes} crime${me.crimes === 1 ? '' : 's'} and ${me.lies} lie${me.lies === 1 ? '' : 's'}.`}
        </p>
      )}
      <ul>
        {sums.map((s) => (
          <li key={s.faction}>
            <span className="dot" style={{ background: PERSONALITIES[s.faction].color }} />
            <strong>{PERSONALITIES[s.faction].name}</strong>: {s.survivors} of {s.total} survived
            {s.firstDeathDay ? `, first death on day ${s.firstDeathDay}` : ', no deaths'}; {s.crimes} crimes, {s.lies} lies.
          </li>
        ))}
      </ul>
      <div className="inline">
        <button onClick={onReplay}>Replay this seed</button>
        <button onClick={onNewSeed}>Try a new seed</button>
        <button onClick={onCopy}>{copied ? 'Link copied' : 'Copy link to this run'}</button>
      </div>
    </section>
  );
}
