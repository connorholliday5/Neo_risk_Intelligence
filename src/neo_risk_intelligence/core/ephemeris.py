from __future__ import annotations

from functools import lru_cache
from typing import Dict

import numpy as np
from skyfield.api import load


PLANET_KEYS = {
    "sun": "sun",
    "mercury": "mercury",
    "venus": "venus",
    "earth": "earth",
    "mars": "mars",
    "jupiter": "jupiter barycenter",
    "saturn": "saturn barycenter",
    "uranus": "uranus barycenter",
    "neptune": "neptune barycenter",
}


@lru_cache(maxsize=1)
def get_ephemeris():
    return load("de421.bsp")


@lru_cache(maxsize=1)
def get_timescale():
    return load.timescale()


def get_planet_positions(julian_date: float) -> Dict[str, np.ndarray]:
    ts = get_timescale()
    eph = get_ephemeris()

    t = ts.tdb(jd=julian_date)

    sun = eph["sun"]
    positions = {}

    for name, key in PLANET_KEYS.items():
        body = eph[key]
        astrometric = sun.at(t).observe(body)
        x, y, z = astrometric.position.au
        positions[name] = np.array([x, y, z], dtype=float)

    return positions


def get_earth_centered_positions(julian_date: float) -> Dict[str, np.ndarray]:
    ts = get_timescale()
    eph = get_ephemeris()

    t = ts.tdb(jd=julian_date)

    earth = eph["earth"]
    positions = {}

    for name, key in PLANET_KEYS.items():
        body = eph[key]
        astrometric = earth.at(t).observe(body)
        x, y, z = astrometric.position.au
        positions[name] = np.array([x, y, z], dtype=float)

    return positions
