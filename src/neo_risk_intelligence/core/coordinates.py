from __future__ import annotations

from typing import Dict
import numpy as np

from astropy.coordinates import SkyCoord, EarthLocation, AltAz
from astropy.time import Time
import astropy.units as u


def radec_to_altaz(
    ra_deg: float,
    dec_deg: float,
    lat: float,
    lon: float,
    elevation_m: float,
    timestamp_dt,  # ?? changed: expect datetime
) -> Dict:
    location = EarthLocation(lat=lat * u.deg, lon=lon * u.deg, height=elevation_m * u.m)
    time = Time(timestamp_dt)  # ?? FIX

    sky = SkyCoord(ra=ra_deg * u.deg, dec=dec_deg * u.deg, frame="icrs")
    altaz_frame = AltAz(obstime=time, location=location)

    altaz = sky.transform_to(altaz_frame)

    return {
        "alt_deg": altaz.alt.degree,
        "az_deg": altaz.az.degree,
    }


def altaz_to_cartesian(alt_deg: float, az_deg: float, radius: float = 1.0) -> np.ndarray:
    alt = np.radians(alt_deg)
    az = np.radians(az_deg)

    x = radius * np.cos(alt) * np.cos(az)
    y = radius * np.cos(alt) * np.sin(az)
    z = radius * np.sin(alt)

    return np.array([x, y, z], dtype=float)
