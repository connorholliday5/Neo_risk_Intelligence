from neo_risk.db import get_connection


def store_anomalies(anomalies_df):
    conn = get_connection()
    anomalies_df.to_sql(
        "neo_anomalies", conn, if_exists="replace", index=False
    )
    conn.close()
