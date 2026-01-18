#!/usr/bin/env python3

"""
Leaderboard sorting (highest balance first).
Equivalent intent to backend/src/services/groupStats.ts ordering.
"""

import json
import sys


def main() -> int:
    rows = json.load(sys.stdin)
    rows.sort(key=lambda r: int(r["creditsMinor"]), reverse=True)
    for i, r in enumerate(rows, start=1):
        r["rank"] = i
    json.dump(rows, sys.stdout, separators=(",", ":"))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

