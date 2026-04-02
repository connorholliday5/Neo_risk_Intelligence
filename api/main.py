from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import numpy as np

from neo_risk_intelligence.core.scene import build_scene
from neo_risk_intelligence.core.sky import build_sky_scene

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def to_float_list(obj):
    if isinstance(obj, (list, tuple, np.ndarray)):
        return [to_float_list(x) for x in obj]
    return float(obj)

def serialize_positions(bodies):
    result = []
    for b in bodies:
        result.append({
            "name": b["name"],
            "position": to_float_list(b["position"])
        })
    return result

@app.get("/scene/{page}")
def get_scene(page: str):
    if page == "sky":
        sky = build_sky_scene(lat=41.7, lon=-71.4)
        sky["stars"] = [{"name":s["name"], "position":to_float_list(s["position"])} for s in sky["stars"]]
        return sky
    else:
        scene = build_scene(page)
        if "bodies" in scene:
            scene["bodies"] = serialize_positions(scene["bodies"])
        if page == "earth":
            scene["earth_centered_bodies"] = serialize_positions(scene["earth_centered_bodies"])
            scene["iss"]["position"] = to_float_list(scene["iss"]["position"])
            scene["neos"] = [{"name":n["name"], "position":to_float_list(n["position"])} for n in scene.get("neos",[])]
        return scene
