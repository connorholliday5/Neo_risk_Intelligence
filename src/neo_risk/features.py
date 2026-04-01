import pandas as pd
from neo_risk.db import get_connection


def load_raw_data():
    conn = get_connection()
    df = pd.read_sql_query("SELECT * FROM neo_raw_feed", conn)
    conn.close()
    return df


def engineer_features(df):
    df["risk_score"] = df["is_hazardous"] * df["velocity_km_s"] / df["miss_distance_km"]
    return df
