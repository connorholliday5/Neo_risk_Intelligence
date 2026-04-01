import pandas as pd
from neo_risk.db import get_connection
from neo_risk.analyze import detect_anomalies
from neo_risk.store_anomalies import store_anomalies


def main():
    conn = get_connection()
    df = pd.read_sql_query("SELECT * FROM neo_features", conn)
    anomalies = detect_anomalies(df)
    store_anomalies(anomalies)
    print(f"Anomalies stored: {len(anomalies)}")


if __name__ == "__main__":
    main()
