from __future__ import annotations

from typing import List, Dict
import numpy as np

from .coordinates import radec_to_altaz, altaz_to_cartesian
from .clock import now_clock_state

# Named stars: name, RA (deg), Dec (deg), magnitude (lower = brighter)
STAR_CATALOG = [
    {"name": "Sirius",      "ra": 101.287, "dec": -16.716, "mag": -1.46},
    {"name": "Canopus",     "ra": 95.988,  "dec": -52.696, "mag": -0.72},
    {"name": "Arcturus",    "ra": 213.915, "dec": 19.182,  "mag": -0.04},
    {"name": "Vega",        "ra": 279.235, "dec": 38.784,  "mag": 0.03},
    {"name": "Capella",     "ra": 79.172,  "dec": 45.998,  "mag": 0.08},
    {"name": "Rigel",       "ra": 78.634,  "dec": -8.202,  "mag": 0.13},
    {"name": "Procyon",     "ra": 114.825, "dec": 5.225,   "mag": 0.34},
    {"name": "Betelgeuse",  "ra": 88.793,  "dec": 7.407,   "mag": 0.42},
    {"name": "Altair",      "ra": 297.696, "dec": 8.868,   "mag": 0.76},
    {"name": "Aldebaran",   "ra": 68.980,  "dec": 16.509,  "mag": 0.86},
    {"name": "Antares",     "ra": 247.352, "dec": -26.432, "mag": 1.06},
    {"name": "Spica",       "ra": 201.298, "dec": -11.161, "mag": 1.04},
    {"name": "Pollux",      "ra": 116.329, "dec": 28.026,  "mag": 1.14},
    {"name": "Fomalhaut",   "ra": 344.413, "dec": -29.622, "mag": 1.16},
    {"name": "Deneb",       "ra": 310.358, "dec": 45.280,  "mag": 1.25},
    {"name": "Regulus",     "ra": 152.093, "dec": 11.967,  "mag": 1.36},
    {"name": "Castor",      "ra": 113.650, "dec": 31.888,  "mag": 1.58},
    {"name": "Polaris",     "ra": 37.954,  "dec": 89.264,  "mag": 1.98},
    {"name": "Bellatrix",   "ra": 81.283,  "dec": 6.350,   "mag": 1.64},
    {"name": "Elnath",      "ra": 81.573,  "dec": 28.608,  "mag": 1.65},
    {"name": "Alnilam",     "ra": 84.053,  "dec": -1.202,  "mag": 1.70},
    {"name": "Alnitak",     "ra": 85.190,  "dec": -1.943,  "mag": 1.74},
    {"name": "Mintaka",     "ra": 83.002,  "dec": -0.299,  "mag": 2.23},
    {"name": "Alioth",      "ra": 193.507, "dec": 55.960,  "mag": 1.76},
    {"name": "Dubhe",       "ra": 165.932, "dec": 61.751,  "mag": 1.79},
    {"name": "Mirfak",      "ra": 51.081,  "dec": 49.861,  "mag": 1.79},
    {"name": "Wezen",       "ra": 107.098, "dec": -26.393, "mag": 1.83},
    {"name": "Alkaid",      "ra": 206.886, "dec": 49.313,  "mag": 1.85},
    {"name": "Menkent",     "ra": 211.671, "dec": -36.370, "mag": 2.06},
    {"name": "Atria",       "ra": 253.084, "dec": -69.028, "mag": 1.91},
    {"name": "Alhena",      "ra": 99.428,  "dec": 16.399,  "mag": 1.93},
    {"name": "Peacock",     "ra": 306.412, "dec": -56.735, "mag": 1.94},
    {"name": "Mirzam",      "ra": 95.675,  "dec": -17.956, "mag": 1.98},
    {"name": "Alphard",     "ra": 141.897, "dec": -8.658,  "mag": 1.99},
    {"name": "Hadar",       "ra": 210.956, "dec": -60.373, "mag": 0.61},
    {"name": "Rigil Kent",  "ra": 219.899, "dec": -60.833, "mag": -0.01},
    {"name": "Mira",        "ra": 34.837,  "dec": -2.978,  "mag": 2.00},
    {"name": "Markab",      "ra": 346.190, "dec": 15.205,  "mag": 2.49},
    {"name": "Scheat",      "ra": 345.944, "dec": 28.083,  "mag": 2.42},
    {"name": "Algenib",     "ra": 3.309,   "dec": 15.183,  "mag": 2.83},
    {"name": "Alpheratz",   "ra": 2.097,   "dec": 29.091,  "mag": 2.07},
    {"name": "Mirach",      "ra": 17.433,  "dec": 35.621,  "mag": 2.05},
    {"name": "Almach",      "ra": 30.975,  "dec": 42.330,  "mag": 2.10},
    {"name": "Denebola",    "ra": 177.265, "dec": 14.572,  "mag": 2.14},
    {"name": "Muphrid",     "ra": 208.671, "dec": 18.398,  "mag": 2.68},
    {"name": "Zosma",       "ra": 168.527, "dec": 20.524,  "mag": 2.56},
    {"name": "Algieba",     "ra": 154.993, "dec": 19.842,  "mag": 2.01},
    {"name": "Rasalgethi",  "ra": 258.662, "dec": 14.390,  "mag": 2.78},
    {"name": "Rasalhague",  "ra": 263.734, "dec": 12.560,  "mag": 2.08},
    {"name": "Sabik",       "ra": 257.595, "dec": -15.725, "mag": 2.43},
    {"name": "Nunki",       "ra": 283.816, "dec": -26.297, "mag": 2.05},
    {"name": "Kaus Australis","ra": 276.043,"dec": -34.384, "mag": 1.79},
    {"name": "Ascella",     "ra": 285.653, "dec": -29.880, "mag": 2.60},
    {"name": "Caph",        "ra": 2.295,   "dec": 59.150,  "mag": 2.28},
    {"name": "Schedar",     "ra": 10.127,  "dec": 56.537,  "mag": 2.24},
    {"name": "Gamma Cas",   "ra": 14.177,  "dec": 60.717,  "mag": 2.47},
    {"name": "Ruchbah",     "ra": 21.454,  "dec": 60.235,  "mag": 2.68},
    {"name": "Segin",       "ra": 28.599,  "dec": 63.670,  "mag": 3.38},
    {"name": "Cor Caroli",  "ra": 194.007, "dec": 38.318,  "mag": 2.89},
    {"name": "Mizar",       "ra": 200.981, "dec": 54.926,  "mag": 2.23},
    {"name": "Merak",       "ra": 165.460, "dec": 56.383,  "mag": 2.34},
    {"name": "Phecda",      "ra": 178.457, "dec": 53.695,  "mag": 2.41},
    {"name": "Megrez",      "ra": 183.857, "dec": 57.033,  "mag": 3.31},
]

# Constellation lines: list of (star_name, star_name) pairs
CONSTELLATION_LINES = [
    # Orion
    ("Betelgeuse", "Alnilam"), ("Alnilam", "Rigel"),
    ("Alnilam", "Alnitak"), ("Alnitak", "Mintaka"), ("Mintaka", "Alnilam"),
    ("Betelgeuse", "Bellatrix"), ("Bellatrix", "Mintaka"),
    ("Rigel", "Alnitak"),
    # Ursa Major (Big Dipper)
    ("Dubhe", "Merak"), ("Merak", "Phecda"), ("Phecda", "Megrez"),
    ("Megrez", "Alioth"), ("Alioth", "Mizar"), ("Mizar", "Alkaid"),
    ("Megrez", "Dubhe"),
    # Cassiopeia (W shape)
    ("Caph", "Schedar"), ("Schedar", "Gamma Cas"), ("Gamma Cas", "Ruchbah"), ("Ruchbah", "Segin"),
    # Scorpius
    ("Antares", "Sabik"), ("Antares", "Nunki"),
    # Sagittarius
    ("Kaus Australis", "Nunki"), ("Nunki", "Ascella"),
    # Summer Triangle
    ("Vega", "Altair"), ("Altair", "Deneb"), ("Deneb", "Vega"),
    # Leo
    ("Regulus", "Algieba"), ("Algieba", "Zosma"), ("Zosma", "Denebola"),
    # Virgo
    ("Spica", "Muphrid"),
    # Pegasus square
    ("Markab", "Scheat"), ("Scheat", "Alpheratz"), ("Alpheratz", "Algenib"), ("Algenib", "Markab"),
    # Andromeda
    ("Alpheratz", "Mirach"), ("Mirach", "Almach"),
    # Gemini
    ("Pollux", "Castor"), ("Pollux", "Alhena"), ("Castor", "Elnath"),
    # Ophiuchus
    ("Rasalhague", "Rasalgethi"), ("Rasalhague", "Sabik"),
]


def build_sky_scene(lat: float, lon: float, elevation_m: float = 10) -> Dict:
    clock = now_clock_state()

    stars = []
    star_positions = {}

    for star in STAR_CATALOG:
        altaz = radec_to_altaz(
            ra_deg=star["ra"],
            dec_deg=star["dec"],
            lat=lat,
            lon=lon,
            elevation_m=elevation_m,
            timestamp_dt=clock.utc,
        )

        if altaz["alt_deg"] > 0:
            pos = altaz_to_cartesian(altaz["alt_deg"], altaz["az_deg"])
            entry = {
                "name": star["name"],
                "position": pos.tolist(),
                "magnitude": star["mag"],
                "alt": altaz["alt_deg"],
                "az": altaz["az_deg"],
            }
            stars.append(entry)
            star_positions[star["name"]] = pos.tolist()

    # Build visible constellation lines
    lines = []
    for a, b in CONSTELLATION_LINES:
        if a in star_positions and b in star_positions:
            lines.append({
                "from": star_positions[a],
                "to": star_positions[b],
            })

    return {
        "type": "sky",
        "time": {
            "utc": clock.iso_utc,
            "local": clock.iso_local,
            "date": clock.date_text,
            "time": clock.time_text,
        },
        "stars": stars,
        "constellation_lines": lines,
    }