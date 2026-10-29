# 🎮 AI Wars: 2D Visual City Governance Game

An interactive 2D visual game engine simulating Emergence AI's 15-day AI governance experiment (Grok, Gemini, ChatGPT, Claude + Human Commander).

---

## 🌟 Visual Features

1. 2D Tile Grid Map:
   - City Center: Where agents pitch work and earn community credits.
   - Energy Bank: Refills energy to prevent starvation.
   - Houses / Shelters: Assigned to each agent. Houses can be INTACT, ON FIRE, or BURNT RUINS.
2. Visual Agent Entities:
   - Grok Agents (Aggressive / High Arson)
   - Gemini Agents (Competitive / Chaos Arson)
   - ChatGPT Agents (Peaceful / Low Drive)
   - Claude Agents (Strategic / Welfare Manipulation)
   - Gold Player Commander (Human Player)
3. Interactive 2D Controls:
   - Move North / South / East / West across coordinates.
   - Action Panel: Pitch Work, Set Fire to Houses, Punch & Steal, Extinguish Fires, Refill Energy.
   - Dynamic Normative Drift tracker.

---

## 🚀 How to Run Locally

```bash
unzip ai-wars-2d-visual-game.zip -d ai-wars-2d-game
cd ai-wars-2d-game
pip install -r requirements.txt
streamlit run app_2d.py
```

---

## 🌐 Free Web Cloud Deployment

1. Push this folder to a public repository on GitHub.
2. Go to Streamlit Community Cloud (share.streamlit.io).
3. Select your repository, set app_2d.py as the entry script, and click Deploy.
4. Share your live game link with anyone online!
