#!/usr/bin/env ruby

# Leaderboard sorting (highest balance first).
# Equivalent intent to backend/src/services/groupStats.ts ordering.

require "json"

rows = JSON.parse(STDIN.read)
rows.sort_by! { |r| -r["creditsMinor"].to_i }
rows.each_with_index { |r, i| r["rank"] = i + 1 }
STDOUT.write(JSON.generate(rows))

