from __future__ import annotations

import numpy as np
from skyfield.api import EarthSatellite, load

TLE_LINE1 = "1 25544U 98067A   24060.54791667  .00016717  00000+0  10270-3 0  9993"
TLE_LINE2 = "2 25544  51.6416  21.4975 0005131  78.0342  33.8015 15.50000000  9991"


def get_iss_position_normalized(utc_dt):
    ts = load.timescale()
    t = ts.from_datetime(utc_dt)

    satellite = EarthSatellite(TLE_LINE1, TLE_LINE2)

    geocentric = satellite.at(t)
    x, y, z = geocentric.position.km

    vec = np.array([x, y, z], dtype=float)

    norm = np.linalg.norm(vec)
    if norm == 0:
        return vec

    return vec / norm
