from neo_risk_intelligence.core.clock import now_clock_state
from neo_risk_intelligence.core.coordinates import radec_to_altaz, altaz_to_cartesian

state = now_clock_state()

# Example: Polaris approx RA/DEC
res = radec_to_altaz(
    ra_deg=37.95,
    dec_deg=89.26,
    lat=41.7,
    lon=-71.4,
    elevation_m=10,
    timestamp_iso=state.iso_utc
)

cart = altaz_to_cartesian(res["alt_deg"], res["az_deg"])

print("ALT/AZ:", res)
print("XYZ:", cart)
