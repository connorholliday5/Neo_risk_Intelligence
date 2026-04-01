import pandas as pd
import sqlite3

DB_PATH = "data/neo_risk.db"

def get_neo_state():
    conn = sqlite3.connect(DB_PATH)
    df = pd.read_sql_query("SELECT * FROM neo_feed", conn)
    conn.close()

    if df.empty:
        return pd.DataFrame()

    # DEBUG: print columns
    print("COLUMNS:", df.columns.tolist())

    # handle different schema names
    name_col = None
    for col in ["object", "name", "designation"]:
        if col in df.columns:
            name_col = col
            break

    if name_col is None:
        return pd.DataFrame()

    if "miss_distance_km" not in df.columns:
        if "miss_distance" in df.columns:
            df["miss_distance_km"] = df["miss_distance"].astype(float)
        else:
            return pd.DataFrame()

    return df[[name_col, "miss_distance_km"]].rename(columns={name_col: "object"})
