import streamlit as st
import streamlit.components.v1 as components

GAME_URL = "https://jadhavs04.github.io/ai-wars-web-game/"

st.set_page_config(
    page_title="AI Wars | 3D City Governance",
    page_icon="⚔️",
    layout="wide",
    initial_sidebar_state="collapsed",
)

st.markdown(
    """
    <style>
      .stApp { background: #080d18; color: #e8eefc; }
      [data-testid="stHeader"] { background: rgba(8,13,24,.92); }
      .block-container { max-width: 1600px; padding-top: 1.2rem; padding-bottom: 1rem; }
      .hero { padding: 1.1rem 1.4rem; border: 1px solid #26354d; border-radius: 16px;
              background: linear-gradient(120deg, #101b2d, #111827 55%, #201334); margin-bottom: 1rem; }
      .hero h1 { margin: 0 0 .25rem 0; color: #f8fafc; font-size: clamp(1.7rem, 3vw, 2.5rem); }
      .hero p { margin: 0; color: #b7c5da; }
      .small-note { color: #aab8ce; font-size: .9rem; }
      iframe { border-radius: 12px; }
    </style>
    <div class="hero">
      <h1>⚔️ AI WARS</h1>
      <p>3D City Governance Simulation · Observe AI agents, explore the city, and play as the Human Commander.</p>
    </div>
    """,
    unsafe_allow_html=True,
)

left, right = st.columns([3, 1])
with left:
    st.markdown("**How to play:** Use the game’s own menu and controls inside the game window. Drag to orbit the 3D city and scroll to zoom, where supported by your device.")
with right:
    st.link_button("Open game in a new tab ↗", GAME_URL, use_container_width=True)

st.divider()

st.markdown("### 🎮 Play AI Wars")
components.iframe(GAME_URL, height=820, scrolling=True)

st.markdown(
    "<p class='small-note'>If the embedded game does not load in your browser, use “Open game in a new tab”. "
    "The game itself is hosted on GitHub Pages; this Streamlit app provides the surrounding launcher page.</p>",
    unsafe_allow_html=True,
)

with st.expander("About this deployment"):
    st.write(
        "This Streamlit wrapper embeds the existing React + Vite + Three.js game instead of rewriting it in Python. "
        "Your game code and gameplay remain hosted at the GitHub Pages URL above. Changes to the frontend should be "
        "built and deployed through your repository's existing GitHub Pages workflow."
    )
    st.code("streamlit run streamlit_app.py", language="bash")
