import numpy as np

PLANETS = {
    "Mercury": {"r": 0.39, "period": 88},
    "Venus": {"r": 0.72, "period": 225},
    "Earth": {"r": 1.00, "period": 365},
    "Mars": {"r": 1.52, "period": 687},
    "Jupiter": {"r": 5.20, "period": 4333}
}

def get_planet_positions(t_days=0):
    positions = []

    for name, data in PLANETS.items():
        r = data["r"]
        period = data["period"]

        angle = 2 * np.pi * (t_days % period) / period

        x = r * np.cos(angle)
        y = r * np.sin(angle)
        z = 0

        positions.append({
            "name": name,
            "x": x,
            "y": y,
            "z": z,
            "r": r
        })

    return positions
