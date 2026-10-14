#!/usr/bin/env python3
import os
import sys

current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.abspath(os.path.join(current_dir, ".."))
sys.path.insert(0, os.path.abspath(os.path.join(root_dir, "..")))

from shortlist.app.models.db import init_db
from shortlist.app.ranking.engine import ShortlistRankingEngine

def main():
    print("Shortlist AI Job Matching Platform (Python Core Engine)")
    print(f"Database location: {os.path.join(root_dir, 'data', 'shortlist.db')}")
    print("Run `python3 shortlist/scripts/evaluate.py` to run full ranking evaluation.")
    print("Run `python3 -m unittest shortlist/tests/test_all.py` to run all unit tests.")

if __name__ == "__main__":
    main()
