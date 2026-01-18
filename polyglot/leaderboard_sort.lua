#!/usr/bin/env lua

-- Leaderboard sorting (highest balance first).
-- Input format: lines like "username creditsMinor"

local rows = {}
for line in io.lines() do
  if line:match("%S") then
    local username, credits = line:match("^(%S+)%s+(%-?%d+)")
    if username and credits then
      table.insert(rows, { username = username, creditsMinor = tonumber(credits) })
    end
  end
end

table.sort(rows, function(a, b) return a.creditsMinor > b.creditsMinor end)

for i, r in ipairs(rows) do
  io.write(string.format("%d %s %d\n", i, r.username, r.creditsMinor))
end

