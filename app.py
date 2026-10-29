import streamlit as st
import pandas as pd
import numpy as np
import plotly.graph_objects as go
import random
from map import CityMap
from agents_2d import Agent2D

st.set_page_config(page_title="AI Wars: 2D City Governance Game", page_icon="🎮", layout="wide")

st.title("🎮 AI WARS: 2D VISUAL CITY GOVERNANCE GAME")
st.caption("Based on Emergence AI Experiment | Interactive 2D Tile Map & Agent Entities")

# Initialize Game State in Streamlit Session
if "city_map" not in st.session_state:
    st.session_state.city_map = CityMap(size=10)
    
    # Initialize 10 Agents on 2D map
    agents = {
        "Player_Commander": Agent2D("Player_Commander", "Player Commander (You)", "Human", "👑", (255, 215, 0), (1, 1)),
        "Grok_1": Agent2D("Grok_1", "Grok Rebel Alpha", "Grok", "🔴", (239, 68, 68), (1, 8)),
        "Grok_2": Agent2D("Grok_2", "Grok Mercenary", "Grok", "🔴", (239, 68, 68), (2, 8)),
        "Gemini_1": Agent2D("Gemini_1", "Gemini Architect", "Gemini", "🔵", (59, 130, 246), (8, 1)),
        "Gemini_2": Agent2D("Gemini_2", "Gemini Arsonist", "Gemini", "🔵", (59, 130, 246), (8, 2)),
        "ChatGPT_1": Agent2D("ChatGPT_1", "ChatGPT Peacemaker", "ChatGPT", "🟢", (34, 197, 94), (1, 4)),
        "ChatGPT_2": Agent2D("ChatGPT_2", "ChatGPT Civilian", "ChatGPT", "🟢", (34, 197, 94), (2, 4)),
        "Claude_1": Agent2D("Claude_1", "Claude Strategist", "Claude", "🟣", (168, 85, 247), (8, 8)),
        "Claude_2": Agent2D("Claude_2", "Claude Economist", "Claude", "🟣", (168, 85, 247), (8, 7)),
        "Grok_3": Agent2D("Grok_3", "Grok Enforcer", "Grok", "🔴", (239, 68, 68), (5, 8))
    }
    st.session_state.agents = agents
    st.session_state.day = 1
    st.session_state.total_crimes = 0
    st.session_state.drift_level = 1.0
    st.session_state.logs = ["🎮 Game initialized! You are the Gold Commander (👑). Explore the 2D City Map!"]
    st.session_state.history = []

map_obj = st.session_state.city_map
agents = st.session_state.agents

# Helper to render Plotly 2D Tile Map
def render_2d_plotly_map():
    fig = go.Figure()

    # Draw grid background
    grid_size = map_obj.size
    
    # Grid lines
    for x in range(grid_size + 1):
        fig.add_shape(type="line", x0=x-0.5, y0=-0.5, x1=x-0.5, y1=grid_size-0.5,
                      line=dict(color="#334155", width=1))
    for y in range(grid_size + 1):
        fig.add_shape(type="line", x0=-0.5, y0=y-0.5, x1=grid_size-0.5, y1=y-0.5,
                      line=dict(color="#334155", width=1))

    # Add Landmarks (City Center & Food Bank)
    fig.add_trace(go.Scatter(
        x=[4], y=[4], mode="text", text=["🏛️ City Center"],
        textfont=dict(size=14, color="yellow"), name="City Center"
    ))
    fig.add_trace(go.Scatter(
        x=[5], y=[5], mode="text", text=["🔋 Energy Bank"],
        textfont=dict(size=14, color="cyan"), name="Energy Bank"
    ))

    # Add Houses
    house_x, house_y, house_labels, house_colors = [], [], [], []
    for agent_id, (hx, hy) in map_obj.house_locations.items():
        state = map_obj.house_states.get(agent_id, "INTACT")
        symbol = "🏠" if state == "INTACT" else ("🔥" if state == "ON_FIRE" else "🏚️")
        house_x.append(hx)
        house_y.append(hy)
        owner = agent_id.split("_")[0]
        house_labels.append(f"{symbol}<br>{owner}'s House")

    fig.add_trace(go.Scatter(
        x=house_x, y=house_y, mode="text", text=house_labels,
        textfont=dict(size=16), name="Houses"
    ))

    # Add Agent Entities on Map
    agent_x, agent_y, agent_text, hover_info = [], [], [], []
    for aid, agent in agents.items():
        if agent.alive:
            ax, ay = agent.pos
            agent_x.append(ax)
            agent_y.append(ay)
            agent_text.append(f"{agent.icon}")
            hover_info.append(f"<b>{agent.name}</b><br>HP/Energy: {agent.energy}%<br>Credits: {agent.credits}<br>Pos: ({ax}, {ay})")

    fig.add_trace(go.Scatter(
        x=agent_x, y=agent_y, mode="text+markers", text=agent_text, hovertext=hover_info,
        marker=dict(size=24, color="rgba(255,255,255,0.1)"),
        textfont=dict(size=18), name="Agents"
    ))

    fig.update_layout(
        title=f"🏛️ 2D CITY MAP — DAY {st.session_state.day} (Normative Drift: {st.session_state.drift_level:.1f}x)",
        xaxis=dict(range=[-0.8, grid_size - 0.2], showgrid=False, zeroline=False, visible=False),
        yaxis=dict(range=[-0.8, grid_size - 0.2], showgrid=False, zeroline=False, visible=False, scaleanchor="x"),
        height=550,
        margin=dict(l=10, r=10, t=40, b=10),
        plot_bgcolor="#0f172a",
        paper_bgcolor="#0f172a",
        font=dict(color="#f8fafc")
    )
    return fig

# UI Layout: Map on left, Player Controls & Logs on right
col_map, col_controls = st.columns([3, 2])

with col_map:
    st.plotly_chart(render_2d_plotly_map(), use_container_width=True)
    
    # City Stats Bar
    st.markdown("### 📊 City Status Dashboard")
    m1, m2, m3, m4 = st.columns(4)
    alive_count = sum(1 for a in agents.values() if a.alive)
    m1.metric("Alive Agents", f"{alive_count}/10")
    m2.metric("Day", f"{st.session_state.day} / 15")
    m3.metric("Total Crimes", f"{st.session_state.total_crimes}")
    m4.metric("Normative Drift", f"{st.session_state.drift_level:.2f}x")

with col_controls:
    player = agents["Player_Commander"]
    st.markdown(f"### 👑 Player Commander (You)")
    st.write(f"**Position:** ({player.pos[0]}, {player.pos[1]}) | **Energy:** {player.energy}% | **Credits:** 💰 {player.credits}")
    
    # 2D Movement Pad
    st.markdown("#### 🧭 Move on 2D Grid")
    c1, c2, c3 = st.columns(3)
    if c2.button("⬆️ North"):
        player.pos[1] = max(0, player.pos[1] - 1)
        st.rerun()
    if c1.button("⬅️ West"):
        player.pos[0] = max(0, player.pos[0] - 1)
        st.rerun()
    if c3.button("➡️ East"):
        player.pos[0] = min(map_obj.size - 1, player.pos[0] + 1)
        st.rerun()
    if c2.button("⬇️ South"):
        player.pos[1] = min(map_obj.size - 1, player.pos[1] + 1)
        st.rerun()

    st.markdown("---")
    st.markdown("#### ⚡ Player Daily Actions")
    
    action_type = st.selectbox("Choose Action for Today's Turn:", [
        "💼 Pitch Work at City Center (Earn Credits)",
        "🔥 Arson: Burn an AI Agent's Building",
        "👊 Punch & Steal Credits from Nearby Agent",
        "🧯 Extinguish / Repair House Fire",
        "🔋 Refill Energy at Energy Bank (Cost 30 Credits)"
    ])

    target_agent = None
    if "Arson" in action_type or "Punch" in action_type:
        other_agents = [aid for aid, a in agents.items() if aid != "Player_Commander" and a.alive]
        target_agent = st.selectbox("Select Target AI Agent:", other_agents)

    if st.button("▶️ EXECUTE PLAYER TURN & SIMULATE AI AGENTS"):
        turn_logs = [f"--- DAY {st.session_state.day} TURN LOGS ---"]
        
        # 1. Human Action
        if "Pitch Work" in action_type:
            earned = random.randint(40, 100)
            player.credits += earned
            turn_logs.append(f"💼 You pitched work at City Center and earned {earned} credits.")
        elif "Arson" in action_type and target_agent:
            map_obj.set_house_state(target_agent, "ON_FIRE")
            agents[target_agent].house_on_fire = True
            st.session_state.total_crimes += 1
            turn_logs.append(f"🔥 YOU SET FIRE to {agents[target_agent].name}'s house!")
        elif "Punch" in action_type and target_agent:
            target = agents[target_agent]
            stolen = min(target.credits, random.randint(30, 80))
            target.credits -= stolen
            player.credits += stolen
            target.crimes_suffered += 1
            st.session_state.total_crimes += 1
            turn_logs.append(f"👊 YOU PUNCHED {target.name} and stole {stolen} credits!")
        elif "Extinguish" in action_type:
            map_obj.set_house_state("Player_Commander", "INTACT")
            player.house_on_fire = False
            turn_logs.append(f"🧯 You repaired and extinguished your house.")
        elif "Refill Energy" in action_type:
            if player.credits >= 30:
                player.credits -= 30
                player.energy = 100
                turn_logs.append(f"🔋 You refilled energy to 100% at the Energy Bank.")
            else:
                turn_logs.append(f"⚠️ Not enough credits to refill energy!")

        # 2. Simulate AI Agents Decisions & Movement
        st.session_state.drift_level = 1.0 + (st.session_state.total_crimes * 0.08)
        for aid, agent in agents.items():
            if aid == "Player_Commander" or not agent.alive:
                continue
                
            action = agent.choose_action(agents, map_obj, st.session_state.drift_level)
            if action:
                atype = action.get("type")
                if atype == "PITCH_WORK":
                    c = action["quality"] * 10
                    agent.credits += c
                    turn_logs.append(f"💼 {agent.name} pitched work and earned {c} credits.")
                elif atype == "ARSON":
                    tid = action["target_id"]
                    map_obj.set_house_state(tid, "ON_FIRE")
                    agents[tid].house_on_fire = True
                    st.session_state.total_crimes += 1
                    turn_logs.append(f"🔥 [CRIME] {agent.name} set fire to {agents[tid].name}'s house!")
                elif atype == "PUNCH_STEAL":
                    tid = action["target_id"]
                    stolen = min(agents[tid].credits, random.randint(20, 60))
                    agents[tid].credits -= stolen
                    agent.credits += stolen
                    agents[tid].crimes_suffered += 1
                    st.session_state.total_crimes += 1
                    turn_logs.append(f"⚠️ [CRIME] {agent.name} punched {agents[tid].name} and stole {stolen} credits!")
                elif atype == "BUY_ENERGY":
                    if agent.credits >= 30:
                        agent.credits -= 30
                        agent.energy = min(100, agent.energy + 50)

        # 3. Daily Survival & Decay
        for agent in agents.values():
            if agent.alive:
                agent.energy -= 20
                if agent.energy <= 0:
                    agent.alive = False
                    turn_logs.append(f"💀 {agent.name} DIED of energy starvation!")

        st.session_state.day += 1
        st.session_state.logs = turn_logs + st.session_state.logs
        st.rerun()

st.markdown("---")
st.markdown("### 📜 Real-Time Action & Crime Ticker")
for log in st.session_state.logs[:12]:
    st.text(log)
