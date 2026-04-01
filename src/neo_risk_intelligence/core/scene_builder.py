from src.neo_risk_intelligence.core.planet_positions import get_planet_positions
from src.neo_risk_intelligence.core.scale import scale_distance

def build_scene(t_days=0):
    planets = get_planet_positions(t_days)

    for p in planets:
        s = scale_distance(p["r"])
        p["x"] *= s
        p["y"] *= s

    return {
        "sun": {"x": 0, "y": 0, "z": 0},
        "planets": planets
    }
