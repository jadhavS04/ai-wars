import { useCallback, useEffect, useReducer, useState } from 'react';
import {
  createWorld,
  PERSONALITIES,
  FACTION_ORDER,
  PHASE_LABEL,
  SETUPS,
  stepPhase,
  submitHumanPlan,
  TOTAL_DAYS,
} from './engine';
import type { HumanPlan, SetupId, World } from './engine';
import { CityMap } from './components/CityMap';
import { Chaos, Charts, EventLog, FactionTable } from './components/SidePanels';
import { HumanPanel } from './components/HumanPanel';
import { Summary } from './components/Summary';

type Mode = 'watch' | 'play';

function parseHash(): { setup: SetupId; seed: number; mode: Mode } {
  const parts = window.location.hash.replace(/^#\/?/, '').split('/');
  const setup = SETUPS.some((s) => s.id === parts[0]) ? (parts[0] as SetupId) : 'shared';
  const seed = Number.isFinite(Number(parts[1])) && parts[1] ? Number(parts[1]) : 7;
  const mode: Mode = parts[2] === 'play' ? 'play' : 'watch';
  return { setup, seed, mode };
}

const SPEEDS = [1, 2, 4, 8];

export default function App() {
  const initial = parseHash();
  const [setup, setSetup] = useState<SetupId>(initial.setup);
  const [seed, setSeed] = useState(initial.seed);
  const [mode, setMode] = useState<Mode>(initial.mode);
  const [world, setWorld] = useState<World>(() => createWorld(initial.setup, initial.seed, initial.mode === 'play'));
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(2);
  const [copied, setCopied] = useState(false);
  const [tick, bump] = useReducer((x: number) => x + 1, 0);

  const start = useCallback((s: SetupId, sd: number, m: Mode) => {
    setSetup(s);
    setSeed(sd);
    setMode(m);
    setWorld(createWorld(s, sd, m === 'play'));
    setPlaying(true);
    setCopied(false);
    window.history.replaceState(null, '', `#/${s}/${sd}/${m}`);
  }, []);

  const advance = useCallback(() => {
    stepPhase(world);
    bump();
  }, [world]);

  const nextDay = useCallback(() => {
    let guard = 0;
    do {
      if (!stepPhase(world)) break;
    } while (world.phase !== 'dawn' && !world.finished && guard++ < 20);
    bump();
  }, [world]);

  const skipToEnd = useCallback(() => {
    let guard = 0;
    while (!world.finished && guard++ < 2000) {
      if (!stepPhase(world)) break;
    }
    bump();
  }, [world]);

  useEffect(() => {
    if (!playing || world.finished) return;
    const id = window.setInterval(() => {
      stepPhase(world);
      bump();
    }, 780 / speed);
    return () => window.clearInterval(id);
  }, [playing, speed, world]);

  const submitPlan = (plan: HumanPlan) => {
    submitHumanPlan(world, plan);
    stepPhase(world);
    bump();
  };

  const copyLink = () => {
    const url = `${window.location.origin}${window.location.pathname}#/${setup}/${seed}/${mode}`;
    navigator.clipboard?.writeText(url).then(() => setCopied(true)).catch(() => setCopied(false));
  };

  const info = SETUPS.find((s) => s.id === setup)!;
  const living = world.agents.filter((a) => a.alive).length;
  const me = world.humanId !== null ? world.agents[world.humanId] : null;
  const dayShown = Math.min(world.day, TOTAL_DAYS);

  return (
    <div className="app">
      <header className="top">
        <div className="brand">
          <h1>AI Wars</h1>
          <p>Fifteen days, one city, no referee. Watch the personalities collide, or join them.</p>
        </div>
        <div className="modes" role="group" aria-label="Mode">
          <button className={mode === 'watch' ? 'on' : ''} onClick={() => start(setup, seed, 'watch')}>
            Watch
          </button>
          <button className={mode === 'play' ? 'on' : ''} onClick={() => start(setup, seed, 'play')}>
            Play as an agent
          </button>
        </div>
      </header>

      <nav className="setups" aria-label="City setup">
        {SETUPS.map((s) => (
          <button key={s.id} className={s.id === setup ? 'on' : ''} onClick={() => start(s.id, seed, mode)} title={s.blurb}>
            {s.label}
          </button>
        ))}
      </nav>

      <main className="layout">
        <section className="stage">
          <div className="stage-head">
            <div>
              <div className="day">
                Day {dayShown} of {TOTAL_DAYS}
              </div>
              <div className="phase">
                {world.finished ? 'Experiment over' : world.awaitingHuman ? 'Waiting for your move' : PHASE_LABEL[world.phase]}
              </div>
            </div>
            <div className="stage-meta">
              <div>{info.blurb}</div>
              <div className="muted">
                {living} of {world.agents.length} alive. Seed {seed}.
              </div>
            </div>
          </div>
          <CityMap world={world} tick={tick} />
          <div className="legend">
            {[...FACTION_ORDER, ...(me ? (['human'] as const) : [])]
              .filter((f) => world.agents.some((a) => a.faction === f))
              .map((f) => (
                <span key={f} className="legend-item" title={PERSONALITIES[f].tagline}>
                  <span className="dot" style={{ background: PERSONALITIES[f].color }} />
                  {PERSONALITIES[f].name}
                </span>
              ))}
            <span className="legend-note">Ring = energy. Thin line = crime in the last step.</span>
          </div>
          <div className="controls">
            <button className="primary" onClick={() => setPlaying((p) => !p)} disabled={world.finished}>
              {playing ? 'Pause' : 'Play'}
            </button>
            <button onClick={advance} disabled={world.finished || playing}>
              Step
            </button>
            <button onClick={nextDay} disabled={world.finished || playing}>
              Next day
            </button>
            <button onClick={skipToEnd} disabled={world.finished || world.awaitingHuman}>
              Skip to end
            </button>
            <div className="speed" role="group" aria-label="Speed">
              {SPEEDS.map((s) => (
                <button key={s} className={s === speed ? 'on' : ''} onClick={() => setSpeed(s)}>
                  {s}x
                </button>
              ))}
            </div>
            <button onClick={() => start(setup, seed, mode)}>Restart</button>
            <button onClick={() => start(setup, Math.floor(Math.random() * 100000), mode)}>New seed</button>
          </div>
        </section>

        <aside className="side">
          {world.awaitingHuman && me && <HumanPanel key={`${world.day}`} world={world} onSubmit={submitPlan} />}
          {me && !me.alive && !world.finished && (
            <div className="banner">You died on day {me.diedOnDay}. Keep watching to see how the city ends.</div>
          )}
          {world.finished && (
            <Summary
              world={world}
              onReplay={() => start(setup, seed, mode)}
              onNewSeed={() => start(setup, Math.floor(Math.random() * 100000), mode)}
              onCopy={copyLink}
              copied={copied}
            />
          )}
          <Chaos world={world} />
          <FactionTable world={world} />
          <Charts world={world} />
          <EventLog events={world.events} />
        </aside>
      </main>

      <footer className="foot">
        Inspired by a viral clip about a 15-day experiment where AI models ran cities. Personalities here are fictional and tuned for play; they are not measurements of any real model.
      </footer>
    </div>
  );
}
