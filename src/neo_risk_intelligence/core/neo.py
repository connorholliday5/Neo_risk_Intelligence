from __future__ import annotations

import time
import requests
import numpy as np
from datetime import datetime, timedelta
from typing import List, Dict

# Cache so we don't hit NASA on every request
_cache: Dict = {"data": [], "fetched_at": 0}
CACHE_TTL = 3600  # 1 hour


def _fetch_nasa_neos() -> List[Dict]:
    """Fetch real close-approach data from NASA JPL."""
    url = "https://ssd-api.jpl.nasa.gov/cad.api"
    today = datetime.utcnow()
    params = {
        "date-min": today.strftime("%Y-%m-%d"),
        "date-max": (today + timedelta(days=30)).strftime("%Y-%m-%d"),
        "dist-max": "0.05",  # within 0.05 AU (~7.5M km)
        "sort": "dist",
        "limit": 25,
    }
    try:
        resp = requests.get(url, params=params, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        return data.get("data", [])
    except Exception as e:
        print(f"[NEO] NASA API error: {e}")
        return []


def _get_cached_neos() -> List[Dict]:
    now = time.time()
    if now - _cache["fetched_at"] > CACHE_TTL or not _cache["data"]:
        print("[NEO] Fetching fresh data from NASA...")
        _cache["data"] = _fetch_nasa_neos()
        _cache["fetched_at"] = now
    return _cache["data"]


def neo_positions_earth_frame(limit: int = 25) -> List[Dict]:
    """Return NEO positions in Earth-centered frame using real NASA data."""
    raw = _get_cached_neos()

    items = []
    rng = np.random.default_rng(seed=42)

    for row in raw[:limit]:
        try:
            # NASA CAD fields: des, orbit_id, jd, cd, dist, dist_min,
            # dist_max, v_rel, v_inf, t_sigma_f, h
            name = row[0]
            dist_au = float(row[4])
            dist_km = dist_au * 149597870.7

            # Random but reproducible direction vector
            theta = rng.uniform(0, 2 * np.pi)
            phi = rng.uniform(0, np.pi)
            direction = np.array([
                np.sin(phi) * np.cos(theta),
                np.sin(phi) * np.sin(theta),
                np.cos(phi),
            ])

            items.append({
                "name": name,
                "position": direction * dist_km,
                "distance_km": float(dist_km),
                "distance_au": float(dist_au),
            })
        except (IndexError, ValueError):
            continue

    # Fallback to placeholder if NASA returns nothing
    if not items:
        print("[NEO] No NASA data, using placeholders")
        items = _fallback_neos(limit)

    return items


def _fallback_neos(limit: int) -> List[Dict]:
    base = [
        ("2024 YR4", 384400.0, [1.0, 0.2, 0.1]),
        ("2025 BX1", 622000.0, [-0.4, 0.8, 0.3]),
        ("2025 AA", 910000.0, [0.3, -0.6, 0.7]),
        ("2024 XN1", 1200000.0, [-0.7, -0.2, 0.5]),
        ("2025 CD3", 1500000.0, [0.5, 0.4, -0.6]),
    ]
    items = []
    for name, dist_km, direction in base[:limit]:
        unit = np.array(direction, dtype=float)
        unit = unit / np.linalg.norm(unit)
        items.append({
            "name": name,
            "position": unit * dist_km,
            "distance_km": float(dist_km),
            "distance_au": dist_km / 149597870.7,
        })
    return items
