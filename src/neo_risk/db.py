import sqlite3
from pathlib import Path

DB_PATH = Path("data/neo_risk.db")


def get_connection():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    return sqlite3.connect(DB_PATH)


def init_db():
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
    CREATE TABLE IF NOT EXISTS neo_objects (
        id TEXT PRIMARY KEY,
        name TEXT,
        nasa_jpl_url TEXT
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS neo_raw_feed (
        date TEXT,
        neo_id TEXT,
        name TEXT,
        is_hazardous INTEGER,
        approach_date TEXT,
        miss_distance_km REAL,
        velocity_km_s REAL,
        UNIQUE(neo_id, approach_date)
    )
    """)

    conn.commit()
    conn.close()


if __name__ == "__main__":
    init_db()
