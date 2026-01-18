#!/usr/bin/env python3

"""
Poker deck + draw (Texas Hold'em-style) translation from:
backend/src/services/games/poker.ts
"""

import json
import random
import sys

SUITS = ["♠", "♥", "♦", "♣"]
RANKS = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"]


def build_deck():
    return [{"suit": s, "rank": r} for s in SUITS for r in RANKS]


def draw(deck):
    idx = random.randrange(0, len(deck))
    return deck.pop(idx)


def main() -> int:
    deck = build_deck()
    hand = [draw(deck), draw(deck)]
    json.dump({"hand": hand, "remaining": len(deck)}, sys.stdout, separators=(",", ":"))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

