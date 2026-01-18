#!/usr/bin/env julia

# Leaderboard sorting (highest balance first).
# Input format: lines like "username creditsMinor"

rows = []
for line in eachline(stdin)
  s = strip(line)
  isempty(s) && continue
  parts = split(s)
  length(parts) < 2 && continue
  push!(rows, (username = parts[1], creditsMinor = parse(Int, parts[2])))
end

sort!(rows, by = r -> r.creditsMinor, rev = true)

for (i, r) in enumerate(rows)
  println(i, " ", r.username, " ", r.creditsMinor)
end

