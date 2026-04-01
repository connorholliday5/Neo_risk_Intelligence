import sqlite3
import pandas as pd
from neo_risk.db import get_connection

def store_features(df):
    conn = get_connection()
    df[['neo_id', 'approach_date', 'risk_score']].to_sql(
        'neo_features', conn, if_exists='replace', index=False
    )
    conn.close()

def insert_neo_feed(df):
    conn = get_connection()
    df = pd.DataFrame(df)
    df.to_sql('neo_feed', conn, if_exists='replace', index=False)
    conn.close()
