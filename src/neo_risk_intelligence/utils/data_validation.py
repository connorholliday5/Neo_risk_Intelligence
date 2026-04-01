import pandas as pd

def validate_neo_data(df):
    if df.empty:
        return df

    required_cols = ["x", "y", "z"]

    for col in required_cols:
        if col not in df.columns:
            return pd.DataFrame()

    df = df.dropna(subset=required_cols)

    return df
