import numpy as np

def circular_orbit_position(radius, angle):
    x = radius * np.cos(angle)
    y = radius * np.sin(angle)
    z = 0
    return x, y, z


def get_real_position(neo_id):
    # Placeholder for JPL Horizons integration (next phase)
    return None

