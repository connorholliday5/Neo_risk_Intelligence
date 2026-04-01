import streamlit as st
from neo_risk_intelligence.core.scene import build_scene
from neo_risk_intelligence.core.sky import build_sky_scene
import plotly.graph_objects as go
import time

st.set_page_config(layout="wide")

# Hide UI
st.markdown("""
<style>
#MainMenu {visibility: hidden;}
footer {visibility: hidden;}
header {visibility: hidden;}
</style>
""", unsafe_allow_html=True)

PAGES = ["solar", "earth", "sky"]

if "page_index" not in st.session_state:
    st.session_state.page_index = 0

if "last_switch" not in st.session_state:
    st.session_state.last_switch = time.time()

# Page auto-switch
if time.time() - st.session_state.last_switch > 10:
    st.session_state.page_index = (st.session_state.page_index + 1) % len(PAGES)
    st.session_state.last_switch = time.time()

page = PAGES[st.session_state.page_index]


def render_scene(scene):
    fig = go.Figure()

    if scene["type"] == "solar":
        for b in scene["bodies"]:
            x, y, z = b["position"]
            fig.add_trace(go.Scatter3d(
                x=[x*5], y=[y*5], z=[z*5],
                mode="markers",
                marker=dict(size=5, color="white")
            ))

    elif scene["type"] == "earth":
        fig.add_trace(go.Scatter3d(
            x=[0], y=[0], z=[0],
            mode="markers",
            marker=dict(size=8, color="blue")
        ))

        iss = scene["iss"]["position"]
        fig.add_trace(go.Scatter3d(
            x=[iss[0]*5000], y=[iss[1]*5000], z=[iss[2]*5000],
            mode="markers",
            marker=dict(size=4, color="white")
        ))

        for n in scene["neos"]:
            x, y, z = n["position"]
            fig.add_trace(go.Scatter3d(
                x=[x*5000], y=[y*5000], z=[z*5000],
                mode="markers",
                marker=dict(size=3, color="red")
            ))

    elif scene["type"] == "sky":
        for s in scene["stars"]:
            x, y, z = s["position"]
            fig.add_trace(go.Scatter3d(
                x=[x*10], y=[y*10], z=[z*10],
                mode="markers",
                marker=dict(size=2, color="white")
            ))

    fig.update_layout(
        scene=dict(
            xaxis=dict(visible=False),
            yaxis=dict(visible=False),
            zaxis=dict(visible=False),
            bgcolor="black"
        ),
        margin=dict(l=0, r=0, t=0, b=0),
        paper_bgcolor="black",
    )

    return fig


# Build scene
if page == "sky":
    scene = build_sky_scene(lat=41.7, lon=-71.4)
else:
    scene = build_scene(page)

fig = render_scene(scene)

st.plotly_chart(fig, use_container_width=True)

# Time overlay
st.markdown(
    f"<div style='position:fixed;bottom:10px;right:20px;color:white;font-size:14px;'>"
    f"{scene['time']['date']} | {scene['time']['time']}"
    f"</div>",
    unsafe_allow_html=True
)

# 🔴 AUTO REFRESH LOOP
time.sleep(1)
st.rerun()
