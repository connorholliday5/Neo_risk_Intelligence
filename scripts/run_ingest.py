from neo_risk.ingest import fetch_neo_feed
from neo_risk.parse import parse_neo_feed
from neo_risk.validate import validate_rows
from neo_risk.store import insert_neo_feed


def main():
    data = fetch_neo_feed()

    if not data.get("data"):
        print("[WARNING] No live data received")
        return

    rows = parse_neo_feed(data)
    valid_rows = validate_rows(rows)

    insert_neo_feed(valid_rows)

    print(f"[SUCCESS] Inserted {len(valid_rows)} valid rows (from {len(rows)})")


if __name__ == "__main__":
    main()
