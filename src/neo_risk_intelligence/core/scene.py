from __future__ import annotations

from typing import Dict, Any
import numpy as np

from .clock import now_clock_state
from .ephemeris import get_planet_positions, get_earth_centered_positions
from .iss import get_iss_position_normalized
from .neo import neo_positions_earth_frame
from .transforms import normalize


def build_solar_system_scene() -> Dict[str, Any]:
    clock = now_clock_state()

    heliocentric = get_planet_positions(clock.julian_date)

    return {
        "type": "solar_system",
        "time": {
            "utc": clock.iso_utc,
            "local": clock.iso_local,
            "date": clock.date_text,
            "time": clock.time_text,
        },
        "bodies": [
            {
                "name": name,
                "position": normalize(pos).tolist(),
            }
            for name, pos in heliocentric.items()
        ],
    }


def build_earth_scene() -> Dict[str, Any]:
    clock = now_clock_state()

    earth_frame = get_earth_centered_positions(clock.julian_date)

    iss_pos = get_iss_position_normalized(clock.utc)

    neos = neo_positions_earth_frame(limit=25)

    return {
        "type": "earth",
        "time": {
            "utc": clock.iso_utc,
            "local": clock.iso_local,
            "date": clock.date_text,
            "time": clock.time_text,
        },
        "earth_centered_bodies": [
            {
                "name": name,
                "position": normalize(pos).tolist(),
            }
            for name, pos in earth_frame.items()
        ],
        "iss": {
            "position": normalize(iss_pos).tolist(),
        },
        "neos": [
            {
                "name": n["name"],
                "position": normalize(n["position"]).tolist(),
                "distance_km": n["distance_km"],
            }
            for n in neos
        ],
    }


def build_scene(page: str) -> Dict[str, Any]:
    if page == "solar":
        return build_solar_system_scene()
    elif page == "earth":
        return build_earth_scene()
    else:
        raise ValueError(f"Unknown page: {page}")
