from .horizons_api import fetch_ephemeris
from .ephemeris_parser import parse_horizons_vectors
from neo_risk_intelligence.utils.data_validation import validate_neo_data

def get_trajectory(object_id, start_time, stop_time):
    raw = fetch_ephemeris(object_id, start_time, stop_time)

    df = parse_horizons_vectors(raw)

    df = validate_neo_data(df)

    return df
