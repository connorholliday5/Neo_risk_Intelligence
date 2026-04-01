from __future__ import annotations

from typing import List, Dict
import numpy as np

from .coordinates import radec_to_altaz, altaz_to_cartesian
from .clock import now_clock_state


STAR_CATALOG = [
    {"name": "Polaris", "ra": 37.95, "dec": 89.26},
    {"name": "Sirius", "ra": 101.287, "dec": -16.716},
    {"name": "Betelgeuse", "ra": 88.7929, "dec": 7.4071},
    {"name": "Rigel", "ra": 78.6345, "dec": -8.2016},
    {"name": "Vega", "ra": 279.2347, "dec": 38.7837},
    {"name": "Altair", "ra": 297.6958, "dec": 8.8683},
    {"name": "Deneb", "ra": 310.3579, "dec": 45.2803},
]


def build_sky_scene(lat: float, lon: float, elevation_m: float = 10) -> Dict:
    clock = now_clock_state()

    stars = []

    for star in STAR_CATALOG:
        altaz = radec_to_altaz(
            ra_deg=star["ra"],
            dec_deg=star["dec"],
            lat=lat,
            lon=lon,
            elevation_m=elevation_m,
            timestamp_dt=clock.utc  # ?? FIX
        )

        if altaz["alt_deg"] > 0:
            pos = altaz_to_cartesian(altaz["alt_deg"], altaz["az_deg"])

            stars.append({
                "name": star["name"],
                "position": pos.tolist()
            })

    return {
        "type": "sky",
        "time": {
            "utc": clock.iso_utc,
            "local": clock.iso_local,
            "date": clock.date_text,
            "time": clock.time_text,
        },
        "stars": stars
    }
