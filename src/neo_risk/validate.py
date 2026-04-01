def validate_rows(rows):
    valid = []

    for r in rows:
        if not r.get("neo_id"):
            continue

        if not r.get("approach_date"):
            continue

        valid.append(r)

    return valid
