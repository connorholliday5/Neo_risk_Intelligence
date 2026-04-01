import plotly.graph_objects as go
from neo_risk_intelligence.core.scene import build_scene


SCALE = 5000  # Earth-scale exaggeration


def scale_position(pos):
    return [p * SCALE for p in pos]


def create_earth_scene():
    scene = build_scene("earth")

    fig = go.Figure()

    # Earth at center
    fig.add_trace(go.Scatter3d(
        x=[0], y=[0], z=[0],
        mode="markers",
        marker=dict(size=10, color="blue"),
        name="Earth"
    ))

    # ISS
    iss = scene["iss"]["position"]
    ix, iy, iz = scale_position(iss)

    fig.add_trace(go.Scatter3d(
        x=[ix], y=[iy], z=[iz],
        mode="markers",
        marker=dict(size=4, color="white"),
        name="ISS"
    ))

    # NEOs
    nx, ny, nz = [], [], []
    for neo in scene["neos"]:
        x, y, z = scale_position(neo["position"])
        nx.append(x)
        ny.append(y)
        nz.append(z)

    fig.add_trace(go.Scatter3d(
        x=nx,
        y=ny,
        z=nz,
        mode="markers",
        marker=dict(size=3, color="red"),
        name="NEOs"
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

    fig.show()


if __name__ == "__main__":
    create_earth_scene()
