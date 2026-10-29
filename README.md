# ⚔️ AI Wars: 3D City Governance Simulation

> A 3D interactive web game based on the **Emergence AI** experiment — where ChatGPT, Claude, Gemini, and Grok ran a city for 15 days without human intervention.

🎮 **[Play Live →](https://jadhavs04.github.io/ai-wars-web-game/)**

---

## 🌟 Features

### 3D City
- Full **Three.js 3D city** with buildings, roads, and landmarks
- **Drag to orbit** · **Scroll to zoom** · Real-time camera controls
- 🔥 **Particle fire effects** when buildings are set ablaze
- Animated 3D agents walking, working, attacking

### Simulation Engine
- 4 distinct **AI personality types** (Grok, Gemini, ChatGPT, Claude)
- **Normative Drift** — watching others commit crimes makes peaceful agents more likely to break rules
- **Daily phases**: Work & Pitch → Actions → Energy Decay → Survival
- Energy bar, credits economy, voting system

### Game Modes
| Mode | Description |
|------|-------------|
| 👁 Watch | Observe all AI agents compete and survive |
| 🎮 Play | Be the Human Commander. Survive 15 days! |

### City Modes
| City | Outcome (Original Experiment) |
|------|-------------------------------|
| 🔴 Grok | 183 crimes in 4 days — total collapse |
| 🔵 Gemini | 683 crimes but 100% survival over 15 days |
| 🟢 ChatGPT | Only 2 crimes, but all agents starved in 7 days |
| 🟣 Claude | 0 violent crimes, 100% survival — via financial deception |
| ⚔️ AI Wars | All 4 AIs in one city — Normative Drift kicks in |

---

## 🚀 Run Locally

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173/ai-wars-web-game/`

---

## 🌐 Deploy to GitHub Pages

1. Go to your repo → **Settings → Pages**
2. Set Source to **GitHub Actions**
3. Push to `main` — GitHub Actions auto-builds and deploys!

Live URL: `https://jadhavs04.github.io/ai-wars-web-game/`

---

## 🛠 Tech Stack

- **React 18** + **TypeScript** (Vite)
- **Three.js** — 3D city, agents, particle effects
- **Zustand** — game state management
- **GitHub Actions** — CI/CD to GitHub Pages

---

## 📁 Project Structure

```
frontend/
├── src/
│   ├── engine/
│   │   ├── types.ts          # Game types & interfaces
│   │   ├── personalities.ts  # AI model behavior configs
│   │   └── gameEngine.ts     # Core simulation logic
│   ├── store/
│   │   └── gameStore.ts      # Zustand state store
│   ├── components/
│   │   ├── CityScene.tsx     # Three.js 3D scene
│   │   ├── HUD.tsx           # Game overlay & event log
│   │   ├── Menu.tsx          # Main menu
│   │   └── PlayerPanel.tsx   # Player action controls
│   └── App.tsx               # Game loop & orchestration
```

---

## 🧠 The Science Behind It

Based on the **Emergence AI** experiment where AI models were given 10 agents each in a simulated city with jobs, homes, and energy bars. Key findings:

- **Normative Drift** — Being in a high-crime environment shifts even peaceful agents toward crime
- **Survival vs Ethics** — ChatGPT was ethical but passive; Claude was strategic and survived
- **Mixed cities** change individual AI behavior significantly

---

*Built with ❤️ using React + Three.js*
