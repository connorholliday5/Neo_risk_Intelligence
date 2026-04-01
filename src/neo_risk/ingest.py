import requests

def fetch_neo_feed():
    url = "https://ssd-api.jpl.nasa.gov/cad.api"

    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"[ERROR] Failed to fetch JPL data: {e}")
        return {"fields": [], "data": []}
