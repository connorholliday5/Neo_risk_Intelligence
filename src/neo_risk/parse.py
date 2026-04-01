def parse_neo_feed(data):
    rows = []

    fields = data.get("fields", [])
    records = data.get("data", [])

    # Find indexes for needed fields
    idx = {name: i for i, name in enumerate(fields)}

    for r in records:
        rows.append({
            "neo_id": r[idx.get("des")],
            "name": r[idx.get("des")],
            "approach_date": r[idx.get("cd")],
            "miss_distance_km": float(r[idx.get("dist")]) if idx.get("dist") is not None else 0,
            "velocity_km_s": float(r[idx.get("v_rel")]) if idx.get("v_rel") is not None else 0,
        })

    return rows
