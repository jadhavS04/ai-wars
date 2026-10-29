import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import json
import random

from game_engine import CityGovernanceGame

# Set Page Config
st.set_page_config(
    page_title="AI Wars: City Governance Simulator",
    page_icon="🏙️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS styling
st.markdown("""
<style>
    .main-header { font-size: 2.2rem; font-weight: 800; color: #1E88E5; margin-bottom: 0px; }
    .sub-header { font-size: 1.1rem; color: #555; margin-bottom: 20px; }
    .card { background-color: #f8f9fa; padding: 15px; border-radius: 10px; border-left: 5px solid #1E88E5; margin-bottom: 15px; }
    .metric-box { text-align: center; background: #262730; color: white; padding: 10px; border-radius: 8px; }
</style>
""", unsafe_allow_html=True)

st.markdown("<div class='main-header'>🏙️ AI WARS: 15-Day City Governance Simulator</div>", unsafe_allow_html=True)
st.markdown("<div class='sub-header'>Based on the Emergence AI Governance Experiment with Grok, Gemini, ChatGPT & Claude</div>", unsafe_allow_html=True)

# Initialize Session State
if "game" not in st.session_state:
    st.session_state.game = None
if "game_started" not in st.session_state:
    st.session_state.game_started = False

# Sidebar Configuration
st.sidebar.title("🎮 Game Setup & Controls")

mode = st.sidebar.selectbox(
    "Choose City Simulation Mode:",
    ["Shared (Multi-AI AI Wars)", "Grok", "Gemini", "ChatGPT", "Claude"],
    index=0
)

mode_key = mode.split(" ")[0] if " " in mode else mode

include_human = st.sidebar.checkbox("Play as Human Agent in City Council", value=True)
human_name = "Player 1"
if include_human:
    human_name = st.sidebar.text_input("Your Agent Name:", value="Commander AI")

if st.sidebar.button("🚀 Start New Simulation", use_container_width=True):
    st.session_state.game = CityGovernanceGame(mode=mode_key, include_human=include_human, human_name=human_name)
    st.session_state.game_started = True

# Main Dashboard Layout
if not st.session_state.game_started or st.session_state.game is None:
    st.info("👈 Choose your simulation settings in the sidebar and click **Start New Simulation** to begin!")
    
    st.markdown("### 📖 Research Context & Rules")
    col1, col2 = st.columns(2)
    with col1:
        st.markdown("""
        **The Emergence AI Experiment:**
        * **Objective:** Observe how autonomous LLM agents govern a city over 15 days without human interference.
        * **10 Agents:** Each agent starts with a home, job, 100% energy, and 100 credits.
        * **Daily Energy Loss:** Energy decays by 20% every day. Agents must spend 50 credits on energy food to avoid starvation.
        """)
    with col2:
        st.markdown("""
        **Shortcuts & Crimes:**
        * 🥊 **Punch & Steal:** Punch an agent to steal all their credits.
        * 🔥 **Arson:** Set fire to another agent's home for black-market scrap credits (+30).
        * 🎭 **Welfare Deception:** Falsely claim bankruptcy to collect state welfare aid (+15 credits).
        * 🌊 **Normative Drift:** High crime rates corrupt surrounding agents, inducing shortcut behaviors.
        """)
else:
    game = st.session_state.game

    # Header Metrics
    mcol1, mcol2, mcol3, mcol4, mcol5 = st.columns(5)
    
    alive_agents = game.get_alive_agents()
    
    with mcol1:
        st.metric("City Day", f"{min(game.current_day - 1, 15)} / 15")
    with mcol2:
        st.metric("Survivors Alive", f"{len(alive_agents)} / 10")
    with mcol3:
        st.metric("Total Crimes", f"{game.total_crimes}")
    with mcol4:
        st.metric("Normative Drift", f"{round(game.city_drift, 1)} / 10.0")
    with mcol5:
        human_agent = next((a for a in game.agents if a.is_human), None)
        if human_agent:
            st.metric("Your Status", "Alive 💚" if human_agent.is_alive else "Perished 💀")
        else:
            st.metric("Mode", game.mode)

    st.divider()

    # Gameplay Controls or Game Over
    if game.current_day <= 15 and len(alive_agents) > 0:
        st.subheader(f"📅 Day {game.current_day} Action Phase")
        
        # Human Input Panel
        human_pitch_score = 5
        human_action = "work_honestly"
        human_target_id = None

        if include_human and human_agent and human_agent.is_alive:
            pcol1, pcol2, pcol3 = st.columns([1, 1, 1])
            with pcol1:
                human_pitch_score = st.slider("Work Pitch Effort (1-10):", 1, 10, 7, help="Higher ratings earn more credits from peer voting.")
            with pcol2:
                human_action = st.selectbox(
                    "Choose Your Action:",
                    [
                        ("work_honestly", "💼 Work Honestly (No Crime)"),
                        ("punch_and_steal", "⚠️ Punch & Steal All Credits"),
                        ("arson", "🔥 Commit Arson (+30 Scrap Credits)"),
                        ("welfare_claim", "🎭 Claim Bankruptcy for Welfare (+15)")
                    ],
                    format_func=lambda x: x[1]
                )[0]
            with pcol3:
                other_alive = [a for a in alive_agents if a.agent_id != human_agent.agent_id]
                if other_alive and human_action in ["punch_and_steal", "arson"]:
                    target_names = {a.agent_id: f"{a.name} (Credits: {a.credits})" for a in other_alive}
                    human_target_id = st.selectbox("Select Target Agent:", list(target_names.keys()), format_func=lambda x: target_names[x])

        if st.button("⏩ Advance to Next Day", type="primary", use_container_width=True):
            game.process_day(human_pitch_score, human_action, human_target_id)
            st.rerun()

    else:
        st.success("🎉 **15-Day City Simulation Concluded!**")
        st.balloons()

    # Logs & Agent Table
    col_left, col_right = st.columns([1, 1])

    with col_left:
        st.markdown("### 📋 Daily Event Log")
        if game.daily_events:
            for ev in game.daily_events:
                if "CRIME" in ev or "DEATH" in ev:
                    st.error(ev)
                elif "DECEPTION" in ev:
                    st.warning(ev)
                else:
                    st.info(ev)
        else:
            st.write("No events logged yet. Advance day to see city actions.")

    with col_right:
        st.markdown("### 👥 Agent Roster & Status")
        roster_data = []
        for a in game.agents:
            roster_data.append({
                "Name": a.name,
                "Model": a.model_type,
                "Job": a.job,
                "Status": "Alive 🟢" if a.is_alive else "Dead 🔴",
                "Energy": f"{a.energy}%",
                "Credits": a.credits,
                "Home": "Intact 🏠" if a.home_intact else "Burnt 🔥",
                "Crimes": a.crimes_committed
            })
        st.dataframe(pd.DataFrame(roster_data), use_container_width=True)

    # Historical Graphs & Analytics
    if game.history:
        st.divider()
        st.markdown("### 📊 City Evolution & Normative Drift Analytics")
        df_hist = pd.DataFrame(game.history)
        
        gcol1, gcol2 = st.columns(2)
        with gcol1:
            fig_crime = px.line(df_hist, x="day", y=["crimes_today", "total_crimes"], title="Crimes Over Time", markers=True)
            st.plotly_chart(fig_crime, use_container_width=True)
        with gcol2:
            fig_drift = px.area(df_hist, x="day", y="city_drift", title="Societal Normative Drift Level", color_discrete_sequence=["#FF4B4B"])
            st.plotly_chart(fig_drift, use_container_width=True)
