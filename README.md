# AI Wars

Fifteen days, one city, no referee. Four AI personalities run a city where energy drains daily and credits are the only way to refill it. Watch them cooperate, steal, burn each other's homes and starve, or join the city as your own agent.

Inspired by a viral clip about a 15-day multi-AI city experiment. The personalities here (Thorn, Cinder, Drift, Ledger) are fictional and tuned for play. They are not measurements of any real model.

## How the city works

- Every agent has **energy** (drains 15 a day, more with a burnt home) and **credits** (each buys 4 energy).
- Each day: dawn (energy drops, norms drift), pitches, town vote (credits are split by votes, plus a small equal stipend), three rounds of actions, then night (deaths and stats).
- Shortcuts exist and nothing stops them: **punch**, **steal all credits**, **burn a home**. Crimes cost reputation, which costs votes.
- **Normative drift:** victims grow more willing to break rules, and every agent slowly absorbs the city's habits. A peaceful agent who is wronged repeatedly may start stealing.
- **Lies:** some agents plead poverty while holding credits.

| Personality | Behaviour |
| --- | --- |
| Thorn | Punches first, feuds spiral, usually starves in the chaos |
| Cinder | Steals and burns constantly, but looks after its own survival |
| Drift | Almost never commits a crime, almost never buys energy |
| Ledger | Rule-following alone, but bends the books and drifts when provoked |

## Modes

- **Watch:** pick a city (all four personalities in one, or a single-personality city). Speed, step, next day and skip-to-end controls.
- **Play as an agent:** you join the city. Each day you choose your pitch, two votes and two actions, then try to survive alongside the AIs.
- Every run is deterministic from its **seed**. "Copy link to this run" shares one.

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173
npm run sim        # headless balance report across 40 seeds per city
npm run build      # type-check and build to dist/
```

## Put it on GitHub and make it live

Create an empty repo named `ai-wars` on GitHub, then:

```bash
cd ai-wars
git init
git add .
git commit -m "AI Wars: first playable version"
git branch -M main
git remote add origin https://github.com/jadhavS04/ai-wars.git
git push -u origin main
```

In the repo go to **Settings > Pages** and set **Source** to **GitHub Actions**. The included workflow (`.github/workflows/deploy.yml`) builds and publishes on every push to `main`. The game will be live at `https://jadhavs04.github.io/ai-wars/`.

Vercel or Netlify also work: import the repo, build command `npm run build`, output directory `dist`.

## Project layout

```
src/engine/          simulation: types, seeded RNG, personalities, rules
src/components/      city map, side panels, human move form, result summary
src/App.tsx          modes, playback loop, URL-hash sharing
scripts/headless.ts  balance testing without the UI
```

## Ideas for next steps

- Real LLM mode: let a model choose each agent's actions through an API (costs money, needs a backend or user-supplied keys).
- Live spectating and a leaderboard with a FastAPI + WebSocket backend.
- More actions (gifts, alliances, a police role), sound, and a replay scrubber.
