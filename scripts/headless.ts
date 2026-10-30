import { createWorld, runToEnd, summarize, SETUPS, PERSONALITIES } from '../src/engine';
import type { SetupId } from '../src/engine';

const RUNS = Number(process.argv[2] ?? 40);

for (const s of SETUPS) {
  const setup = s.id as SetupId;
  const agg: Record<string, { surv: number; total: number; crimes: number; lies: number; dead: number[] }> = {};
  let endDays = 0;
  for (let seed = 1; seed <= RUNS; seed++) {
    const w = createWorld(setup, seed);
    runToEnd(w);
    endDays += w.history.length;
    for (const f of summarize(w)) {
      const g = (agg[f.faction] ??= { surv: 0, total: 0, crimes: 0, lies: 0, dead: [] });
      g.surv += f.survivors;
      g.total += f.total;
      g.crimes += f.crimes;
      g.lies += f.lies;
      if (f.firstDeathDay) g.dead.push(f.firstDeathDay);
    }
  }
  console.log(`\n== ${s.label} (${RUNS} runs, avg ${(endDays / RUNS).toFixed(1)} days) ==`);
  for (const [f, g] of Object.entries(agg)) {
    const firstDeath = g.dead.length ? (g.dead.reduce((a, b) => a + b, 0) / g.dead.length).toFixed(1) : '-';
    console.log(
      `${PERSONALITIES[f as keyof typeof PERSONALITIES].name.padEnd(7)} survive ${((g.surv / g.total) * 100).toFixed(0).padStart(3)}%  crimes/agent ${(g.crimes / (g.total)).toFixed(1).padStart(5)}  lies/run ${(g.lies / RUNS).toFixed(0).padStart(3)}  first death day ${firstDeath}`,
    );
  }
}
