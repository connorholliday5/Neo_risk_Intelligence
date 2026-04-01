import plotly.graph_objects as go
import numpy as np

def sphere(r):
    u = np.linspace(0, 2*np.pi, 40)
    v = np.linspace(0, np.pi, 40)
    x = r*np.outer(np.cos(u), np.sin(v))
    y = r*np.outer(np.sin(u), np.sin(v))
    z = r*np.outer(np.ones(len(u)), np.cos(v))
    return x,y,z

def build_earth():
    fig = go.Figure()

    x,y,z = sphere(1)

    fig.add_trace(go.Surface(x=x,y=y,z=z,showscale=False))

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
