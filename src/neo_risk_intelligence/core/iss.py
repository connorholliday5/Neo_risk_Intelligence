from __future__ import annotations

from datetime import datetime, timezone
from typing import Tuple

import numpy as np
from sgp4.api import Satrec, jday


# Default TLE (ISS) — can be refreshed later from CelesTrak
ISS_TLE = (
    "1 25544U 98067A   24067.54791435  .00016717  00000+0  10270-3 0  9993",
    "2 25544  51.6416  21.2801 0007417  82.8254  40.9808 15.50347145434193",
)


def load_iss_satellite() -> Satrec:
    return Satrec.twoline2rv(ISS_TLE[0], ISS_TLE[1])


def datetime_to_jday(dt: datetime) -> Tuple[float, float]:
    if dt.tzinfo is None:
        raise ValueError("datetime must be timezone-aware")
    dt = dt.astimezone(timezone.utc)

    jd, fr = jday(
        dt.year,
        dt.month,
        dt.day,
        dt.hour,
        dt.minute,
        dt.second + dt.microsecond * 1e-6,
    )
    return jd, fr


def get_iss_position_eci(dt: datetime) -> np.ndarray:
    sat = load_iss_satellite()
    jd, fr = datetime_to_jday(dt)

    error, r, v = sat.sgp4(jd, fr)
    if error != 0:
        raise RuntimeError(f"SGP4 error code: {error}")

    # r is in km in TEME (approx ECI)
    return np.array(r, dtype=float)


def get_iss_position_normalized(dt: datetime) -> np.ndarray:
    # Scale down for visualization (Earth-centered scene)
    pos_km = get_iss_position_eci(dt)

    # Convert km ? AU for consistency with solar system scale
    AU_KM = 149597870.7
    return pos_km / AU_KM
