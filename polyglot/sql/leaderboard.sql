-- Leaderboard query pattern (highest balance first).
-- Mirrors the intent of backend/src/services/groupStats.ts.

SELECT
  w.userId,
  u.username,
  w.creditsMinor
FROM Wallet w
JOIN User u ON u.id = w.userId
WHERE w.groupId = :groupId
ORDER BY w.creditsMinor DESC;

