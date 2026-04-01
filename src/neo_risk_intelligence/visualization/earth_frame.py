import sqlite3
import pandas as pd
import numpy as np

DB_PATH = "data/neo_risk.db"

def load_close_approaches():
    conn = sqlite3.connect(DB_PATH)
    df = pd.read_sql_query("SELECT * FROM neo_feed", conn)
    conn.close()
    return df

def to_earth_centered(df):
    df = df.copy()

    if "miss_distance_km" not in df.columns and "miss_distance" in df.columns:
        df["miss_distance_km"] = df["miss_distance"].astype(float)

    # Generate spherical distribution around Earth using real distance
    theta = np.random.uniform(0, 2 * np.pi, len(df))
    phi = np.random.uniform(0, np.pi, len(df))

    r = df["miss_distance_km"].astype(float)

    df["x"] = r * np.sin(phi) * np.cos(theta)
    df["y"] = r * np.sin(phi) * np.sin(theta)
    df["z"] = r * np.cos(phi)

    return df
