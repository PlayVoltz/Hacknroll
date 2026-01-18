#!/usr/bin/env nim r

# Leaderboard sorting (highest balance first).
# Input format: lines like "username creditsMinor"

import std/[strutils, sequtils, algorithm]

type Row = object
  username: string
  creditsMinor: int

var rows: seq[Row] = @[]
for line in stdin.lines:
  let s = line.strip
  if s.len == 0: continue
  let parts = s.splitWhitespace
  if parts.len < 2: continue
  rows.add Row(username: parts[0], creditsMinor: parseInt(parts[1]))

rows.sort(proc(a, b: Row): int = cmp(b.creditsMinor, a.creditsMinor))

for i, r in rows:
  echo (i + 1), " ", r.username, " ", r.creditsMinor

