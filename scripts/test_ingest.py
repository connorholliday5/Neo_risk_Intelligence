from neo_risk.ingest import fetch_neo_feed


def main():
    data = fetch_neo_feed()
    print(list(data.keys()))


if __name__ == "__main__":
    main()
