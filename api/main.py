import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import asyncio
import json
import time
import requests
import numpy as np
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from config import OBSERVER_LAT, OBSERVER_LON, OBSERVER_ELEVATION_M
from neo_risk_intelligence.core.scene import build_scene
from neo_risk_intelligence.core.sky import build_sky_scene
from neo_risk_intelligence.core.iss import get_iss_position_normalized

app = FastAPI(title="Neo Risk Intelligence API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- ISS TLE cache ---
_tle_cache = {"line1": None, "line2": None, "fetched_at": 0}
TLE_TTL = 3600 * 6  # refresh every 6 hours

def get_fresh_tle():
    now = time.time()
    if now - _tle_cache["fetched_at"] < TLE_TTL and _tle_cache["line1"]:
        return _tle_cache["line1"], _tle_cache["line2"]
    try:
        url = "https://celestrak.org/GPSOC/iss.php"
        resp = requests.get(url, timeout=8)
        lines = [l.strip() for l in resp.text.strip().splitlines() if l.strip()]
        if len(lines) >= 3:
            _tle_cache["line1"] = lines[1]
            _tle_cache["line2"] = lines[2]
            _tle_cache["fetched_at"] = now
            print("[ISS] Fresh TLE fetched")
    except Exception as e:
        print(f"[ISS] TLE fetch failed: {e}")
    return _tle_cache["line1"], _tle_cache["line2"]


# --- Serialization helpers ---
def to_float_list(obj):
    if isinstance(obj, (list, tuple, np.ndarray)):
        return [to_float_list(x) for x in obj]
    return float(obj)

def serialize_positions(bodies):
    return [
        {"name": b["name"], "position": to_float_list(b["position"])}
        for b in bodies
    ]

def build_full_scene(page: str) -> dict:
    if page == "sky":
        sky = build_sky_scene(
            lat=OBSERVER_LAT,
            lon=OBSERVER_LON,
            elevation_m=OBSERVER_ELEVATION_M,
        )
        sky["stars"] = [
            {"name": s["name"], "position": to_float_list(s["position"])}
            for s in sky["stars"]
        ]
        return sky

    scene = build_scene(page)

    if "bodies" in scene:
        scene["bodies"] = serialize_positions(scene["bodies"])

    if page == "earth":
        scene["earth_centered_bodies"] = serialize_positions(
            scene["earth_centered_bodies"]
        )
        scene["iss"]["position"] = to_float_list(scene["iss"]["position"])
        scene["neos"] = [
            {"name": n["name"], "position": to_float_list(n["position"])}
            for n in scene.get("neos", [])
        ]

    return scene


# --- REST endpoints ---
@app.get("/scene/{page}")
def get_scene(page: str):
    try:
        return build_full_scene(page)
    except Exception as e:
        return {"error": str(e), "page": page}

@app.get("/health")
def health():
    return {"status": "ok"}


# --- WebSocket endpoint ---
@app.websocket("/ws/{page}")
async def websocket_scene(websocket: WebSocket, page: str):
    await websocket.accept()
    print(f"[WS] Client connected: {page}")
    try:
        while True:
            try:
                scene = build_full_scene(page)
                await websocket.send_text(json.dumps(scene))
            except Exception as e:
                await websocket.send_text(json.dumps({"error": str(e)}))
            await asyncio.sleep(2)
    except WebSocketDisconnect:
        print(f"[WS] Client disconnected: {page}")
