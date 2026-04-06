# Neo Risk Intelligence — project-wide configuration
# Edit this file to change your location and other settings.

# Observer location (used for sky view)
OBSERVER_LAT = 41.7   # Providence, RI — change to your latitude
OBSERVER_LON = -71.4  # Providence, RI — change to your longitude
OBSERVER_ELEVATION_M = 10

# API server
API_HOST = "0.0.0.0"
API_PORT = 8000

# Ephemeris file (must be in project root)
EPHEMERIS_FILE = "de421.bsp"

# NASA JPL close-approach API
JPL_CAD_URL = "https://ssd-api.jpl.nasa.gov/cad.api"

# Local SQLite database path
DB_PATH = "data/neo_risk.db"
