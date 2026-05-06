from __future__ import annotations
import time
import requests
import numpy as np
from datetime import datetime, timedelta
from typing import List, Dict

# --- NEO cache ---
_cache: Dict = {"data": [], "fetched_at": 0}
CACHE_TTL = 3600

# --- Sentry cache ---
_sentry_cache: Dict = {"data": {}, "fetched_at": 0}
SENTRY_TTL = 3600 * 6  # 6 hours

def _fetch_sentry_risk_map() -> Dict[str, float]:
    """Fetch cumulative impact probabilities from NASA Sentry API."""
    url = "https://ssd-api.jpl.nasa.gov/sentry.api"
    try:
        resp = requests.get(url, timeout=15)
        resp.raise_for_status()
        data = resp.json()
        risk_map = {}
        for obj in data.get("data", []):
            des = obj.get("des", "")
            ip = float(obj.get("ip", 0))
            if des:
                risk_map[des] = ip
        print(f"[SENTRY] Loaded {len(risk_map)} objects with non-zero risk")
        return risk_map
    except Exception as e:
        print(f"[SENTRY] API error: {e}")
        return {}

def _get_sentry_risk_map() -> Dict[str, float]:
    now = time.time()
    if now - _sentry_cache["fetched_at"] > SENTRY_TTL or not _sentry_cache["data"]:
        print("[SENTRY] Fetching fresh data...")
        _sentry_cache["data"] = _fetch_sentry_risk_map()
        _sentry_cache["fetched_at"] = now
    return _sentry_cache["data"]

def _fetch_nasa_neos() -> List[Dict]:
    url = "https://ssd-api.jpl.nasa.gov/cad.api"
    today = datetime.utcnow()
    params = {
        "date-min": today.strftime("%Y-%m-%d"),
        "date-max": (today + timedelta(days=30)).strftime("%Y-%m-%d"),
        "dist-max": "0.05",
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
    """Return NEO positions with distance and impact probability."""
    raw = _get_cached_neos()
    sentry = _get_sentry_risk_map()
    items = []
    rng = np.random.default_rng(seed=42)
    for row in raw[:limit]:
        try:
            name = row[0]
            dist_au = float(row[4])
            dist_km = dist_au * 149597870.7
            theta = rng.uniform(0, 2 * np.pi)
            phi = rng.uniform(0, np.pi)
            direction = np.array([
                np.sin(phi) * np.cos(theta),
                np.sin(phi) * np.sin(theta),
                np.cos(phi),
            ])
            # Look up impact probability from Sentry
            impact_prob = sentry.get(name, None)
            items.append({
                "name": name,
                "position": direction * dist_km,
                "distance_km": float(dist_km),
                "distance_au": float(dist_au),
                "impact_probability": float(impact_prob) if impact_prob is not None else None,
            })
        except (IndexError, ValueError):
            continue
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
            "impact_probability": None,
        })
    return items
