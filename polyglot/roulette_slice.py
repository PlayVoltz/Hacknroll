#!/usr/bin/env python3

"""
Given stopRotationDeg and sliceCount, compute slice index (0..sliceCount-1).
Useful for checking wheel math across implementations.
"""

import json
import math
import sys


def slice_index(stop_rotation_deg: float, slice_count: int) -> int:
    deg = stop_rotation_deg % 360.0
    slice_deg = 360.0 / float(slice_count)
    idx = int(math.floor(deg / slice_deg))
    if idx < 0:
        idx = 0
    if idx >= slice_count:
        idx = slice_count - 1
    return idx


def main() -> int:
    payload = json.load(sys.stdin)
    deg = float(payload["stopRotationDeg"])
    slices = int(payload["sliceCount"])
    json.dump({"sliceIndex": slice_index(deg, slices)}, sys.stdout, separators=(",", ":"))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

