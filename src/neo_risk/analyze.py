import pandas as pd


def detect_anomalies(df):
    # Placeholder: Simple threshold
    return df[df["risk_score"] > df["risk_score"].quantile(0.99)]
