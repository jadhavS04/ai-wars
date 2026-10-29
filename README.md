# AI Wars — Streamlit launcher

This project wraps the existing React/Vite/Three.js AI Wars game in a Streamlit page. It does not port the 3D game engine to Python; it embeds the existing GitHub Pages deployment.

## Files
- `streamlit_app.py` — Streamlit launcher and embedded game
- `requirements.txt` — Python dependency
- `.streamlit/config.toml` — dark theme and server configuration

## Run locally

```bash
python -m venv .venv
# Windows PowerShell:
.venv\Scripts\Activate.ps1
# macOS/Linux:
# source .venv/bin/activate
python -m pip install -r requirements.txt
streamlit run streamlit_app.py
```

Open the local URL printed in the terminal, normally `http://localhost:8501`.

## Deploy to Streamlit Community Cloud
1. Push these files to a GitHub repository. They can be added to the root of your existing `ai-wars-web-game` repository, or committed in a separate deployment repository.
2. Visit https://share.streamlit.io/ and sign in with GitHub.
3. Choose **Create app**, select the repository and branch, and set **Main file path** to `streamlit_app.py`.
4. Deploy. Streamlit installs the packages from `requirements.txt`.

## If the game doesn't show inside the page
Use the **Open game in a new tab** button. The embedded game relies on the GitHub Pages frontend being publicly reachable and allowing it to be displayed in an iframe. Your repository's README currently lists the game URL as:
`https://jadhavs04.github.io/ai-wars-web-game/`

If that URL changes, update `GAME_URL` in `streamlit_app.py`.
