import pandas as pd

def parse_horizons_vectors(data):
    text = data.get("result", "")
    lines = text.splitlines()

    start = None
    end = None

    for i, line in enumerate(lines):
        if "$$SOE" in line:
            start = i + 1
        if "$$EOE" in line:
            end = i
            break

    if start is None or end is None:
        return pd.DataFrame()

    records = []

    for line in lines[start:end]:
        parts = [p.strip() for p in line.split(",")]

        if len(parts) < 6:
            continue

        try:
            x = float(parts[2])
            y = float(parts[3])
            z = float(parts[4])
            records.append([x, y, z])
        except:
            continue

    df = pd.DataFrame(records, columns=["x", "y", "z"])
    return df
