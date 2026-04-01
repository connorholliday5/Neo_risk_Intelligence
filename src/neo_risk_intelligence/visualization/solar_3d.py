import plotly.graph_objects as go
import numpy as np
import time

from neo_risk_intelligence.core.scene import build_scene
from neo_risk_intelligence.core.ephemeris import get_planet_positions


SIZE_MAP = {
    "sun": 20,
    "mercury": 4,
    "venus": 5,
    "earth": 6,
    "mars": 5,
    "jupiter": 10,
    "saturn": 9,
    "uranus": 7,
    "neptune": 7,
}

COLOR_MAP = {
    "sun": "yellow",
    "mercury": "gray",
    "venus": "orange",
    "earth": "blue",
    "mars": "red",
    "jupiter": "orange",
    "saturn": "gold",
    "uranus": "lightblue",
    "neptune": "blue",
}


def log_scale(pos):
    x, y, z = pos

    def transform(v):
        sign = np.sign(v)
        return sign * np.log10(abs(v) + 1)

    return np.array([transform(x), transform(y), transform(z)])


def generate_full_orbit(body_name):
    xs, ys, zs = [], [], []

    for i in range(120):
        jd = 2451545.0 + i * 10
        pos = get_planet_positions(jd)[body_name]

        p = log_scale(pos) * 20
        xs.append(p[0])
        ys.append(p[1])
        zs.append(p[2])

    return xs, ys, zs


def generate_starfield():
    np.random.seed(42)

    layers = []

    for scale, size, opacity in [(200, 1, 0.2), (120, 1.5, 0.3), (60, 2, 0.4)]:
        n = 300

        theta = np.random.uniform(0, 2*np.pi, n)
        phi = np.random.uniform(0, np.pi, n)

        x = scale * np.sin(phi) * np.cos(theta)
        y = scale * np.sin(phi) * np.sin(theta)
        z = scale * np.cos(phi)

        layers.append((x, y, z, size, opacity))

    return layers


def create_3d_scene():
    scene = build_scene("solar")

    fig = go.Figure()

    for x, y, z, size, opacity in generate_starfield():
        fig.add_trace(go.Scatter3d(
            x=x, y=y, z=z,
            mode="markers",
            marker=dict(size=size, color="white"),
            opacity=opacity,
            showlegend=False
        ))

    positions = []

    for body in scene["bodies"]:
        name = body["name"]

        if name != "sun":
            ox, oy, oz = generate_full_orbit(name)

            fig.add_trace(go.Scatter3d(
                x=ox, y=oy, z=oz,
                mode="lines",
                line=dict(width=1, color="white"),
                opacity=0.15,
                showlegend=False
            ))

        p = log_scale(body["position"]) * 20
        positions.append(p)

        if name == "sun":
            for size, opacity in [(50, 0.04), (35, 0.08), (25, 0.15)]:
                fig.add_trace(go.Scatter3d(
                    x=[p[0]], y=[p[1]], z=[p[2]],
                    mode="markers",
                    marker=dict(size=size, color="yellow"),
                    opacity=opacity,
                    showlegend=False
                ))

        fig.add_trace(go.Scatter3d(
            x=[p[0]], y=[p[1]], z=[p[2]],
            mode="markers",
            marker=dict(
                size=SIZE_MAP.get(name, 5),
                color=COLOR_MAP.get(name, "white"),
            ),
            showlegend=False
        ))

    positions = np.array(positions)
    center = positions.mean(axis=0)

    # ?? subtle camera motion
    t = time.time()
    cam_x = 2.4 + 0.3 * np.sin(t * 0.2)
    cam_y = 2.4 + 0.3 * np.cos(t * 0.2)

    fig.update_layout(
        scene=dict(
            xaxis=dict(range=[center[0]-30, center[0]+30], visible=False),
            yaxis=dict(range=[center[1]-30, center[1]+30], visible=False),
            zaxis=dict(range=[center[2]-30, center[2]+30], visible=False),
            bgcolor="black",
            camera=dict(
                eye=dict(x=cam_x, y=cam_y, z=1.8),
                center=dict(x=0, y=0, z=0)
            )
        ),
        margin=dict(l=0, r=0, t=0, b=0),
        paper_bgcolor="black",
    )

    fig.show()


if __name__ == "__main__":
    create_3d_scene()
