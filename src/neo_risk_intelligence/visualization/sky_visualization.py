import matplotlib.pyplot as plt

from src.neo_risk_intelligence.astronomy.star_catalog import load_basic_stars
from src.neo_risk_intelligence.astronomy.sky_projection import ra_dec_to_cartesian
from src.neo_risk_intelligence.astronomy.observer import get_local_sky

def plot_sky(lat=41.5, lon=-71.4):
    stars = load_basic_stars()

    coords = []
    for star in stars:
        coords.append(ra_dec_to_cartesian(star["ra"], star["dec"]))

    sky = get_local_sky(lat, lon, coords)

    az = [s["azimuth"] for s in sky]
    alt = [s["altitude"] for s in sky]

    fig = plt.figure()
    plt.scatter(az, alt)

    plt.xlabel("Azimuth")
    plt.ylabel("Altitude")
    plt.title("Local Sky View")

    return fig
