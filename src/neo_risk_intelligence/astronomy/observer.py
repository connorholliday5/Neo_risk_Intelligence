import math

def get_local_sky(lat, lon, objects):
    results = []

    for obj in objects:
        x, y, z = obj

        r = math.sqrt(x**2 + y**2 + z**2)

        alt = math.degrees(math.asin(z / r))
        az = math.degrees(math.atan2(y, x))

        results.append({
            "altitude": alt,
            "azimuth": az
        })

    return results
