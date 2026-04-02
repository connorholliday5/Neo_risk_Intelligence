from __future__ import annotations

import numpy as np


def normalize(vec):
    v = np.array(vec, dtype=float)
    n = np.linalg.norm(v)
    if n == 0:
        return v
    return v / n


def scale(vec, factor: float):
    return np.array(vec, dtype=float) * float(factor)


def au_to_km(vec):
    return np.array(vec, dtype=float) * 149597870.7


def km_to_au(vec):
    return np.array(vec, dtype=float) / 149597870.7


def earth_radius_normalized(vec_km):
    v = np.array(vec_km, dtype=float)
    r = np.linalg.norm(v)
    if r == 0:
        return v
    return v / r
