from __future__ import annotations

import sqlite3
from typing import List, Dict
import numpy as np
import os


DB_PATH = "data/neo.db"


def fetch_neos(limit: int = 50) -> List[Dict]:
    if not os.path.exists(DB_PATH):
        return []

    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        cursor.execute("""
            SELECT name, miss_distance_km
            FROM neo_feed
            WHERE miss_distance_km IS NOT NULL
            ORDER BY miss_distance_km ASC
            LIMIT ?
        """, (limit,))

        rows = cursor.fetchall()
        conn.close()

    except Exception:
        return []

    neos = []
    for name, dist in rows:
        try:
            neos.append({
                "name": name,
                "miss_distance_km": float(dist),
            })
        except Exception:
            continue

    return neos


def neo_positions_earth_frame(limit: int = 50) -> List[Dict]:
    neos = fetch_neos(limit=limit)

    results = []
    AU_KM = 149597870.7

    for i, neo in enumerate(neos):
        d_au = neo["miss_distance_km"] / AU_KM

        angle = (i / max(1, len(neos))) * 2 * np.pi
        x = d_au * np.cos(angle)
        y = d_au * np.sin(angle)
        z = 0.0

        results.append({
            "name": neo["name"],
            "position": np.array([x, y, z], dtype=float),
            "distance_km": neo["miss_distance_km"],
        })

    return results
