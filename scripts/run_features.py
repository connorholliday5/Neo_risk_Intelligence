from neo_risk.features import load_raw_data, engineer_features
from neo_risk.store import store_features

def main():
    df = load_raw_data()
    df = engineer_features(df)
    store_features(df)
    print("Features stored.")

if __name__ == "__main__":
    main()
