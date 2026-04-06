import numpy as np
from .state_engine import get_neo_state

def get_neo_positions():
    df = get_neo_state()

    if df.empty:
        return []

    positions = []

    for _, row in df.iterrows():
        # scale closer for Earth view
        r = float(row["miss_distance_km"]) / 100_000

        theta = np.random.uniform(0, 2*np.pi)
        phi = np.random.uniform(0, np.pi)

        x = r * np.sin(phi) * np.cos(theta)
        y = r * np.sin(phi) * np.sin(theta)
        z = r * np.cos(phi)

        positions.append({
            "name": row["object"],
            "x": x,
            "y": y,
            "z": z,
            "distance": row["miss_distance_km"]
        })

    return positions
