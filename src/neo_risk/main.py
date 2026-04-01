import sys
import os

def load_env():
    if os.path.exists(".env"):
        with open(".env") as f:
            for line in f:
                if "=" in line:
                    key, val = line.strip().split("=", 1)
                    os.environ[key] = val

load_env()

if "PYTHONPATH" in os.environ:
    sys.path.append(os.environ["PYTHONPATH"])

from neo_risk.db import init_db


def main():
    init_db()
    print("Neo Risk Intelligence initialized")


if __name__ == "__main__":
    main()
