import plotly.graph_objects as go
import numpy as np
from src.neo_risk_intelligence.core.scene_builder import build_scene

def sphere(r):
    u = np.linspace(0, 2*np.pi, 30)
    v = np.linspace(0, np.pi, 30)
    x = r*np.outer(np.cos(u), np.sin(v))
    y = r*np.outer(np.sin(u), np.sin(v))
    z = r*np.outer(np.ones(len(u)), np.cos(v))
    return x,y,z

def build_figure():
    scene = build_scene(100)

    fig = go.Figure()

    # Sun
    x,y,z = sphere(0.3)
    fig.add_trace(go.Surface(x=x,y=y,z=z,showscale=False))

    for p in scene["planets"]:
        px,py,pz = sphere(0.08)

        fig.add_trace(go.Surface(
            x=px + p["x"],
            y=py + p["y"],
            z=pz,
            showscale=False,
            name=p["name"]
        ))

    fig.update_layout(
        scene=dict(
            bgcolor="black",
            xaxis=dict(visible=False),
            yaxis=dict(visible=False),
            zaxis=dict(visible=False)
        ),
        paper_bgcolor="black",
        margin=dict(l=0,r=0,b=0,t=0)
    )

    return fig
