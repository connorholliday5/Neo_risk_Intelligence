import requests

BASE_URL = "https://ssd.jpl.nasa.gov/api/horizons.api"

def fetch_ephemeris(object_id, start_time, stop_time, step="1d"):
    params = {
        "format": "text",
        "COMMAND": object_id,
        "MAKE_EPHEM": "YES",
        "EPHEM_TYPE": "V",
        "CENTER": "500@399",
        "START_TIME": start_time,
        "STOP_TIME": stop_time,
        "STEP_SIZE": step,
        "VEC_TABLE": "2",
        "CSV_FORMAT": "YES"
    }

    response = requests.get(BASE_URL, params=params, timeout=30)
    response.raise_for_status()

    return {"result": response.text}
