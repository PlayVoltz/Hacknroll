<?php
// Leaderboard sorting (highest balance first).
// Equivalent intent to backend/src/services/groupStats.ts ordering.

$input = stream_get_contents(STDIN);
$rows = json_decode($input, true);
if (!is_array($rows)) {
  fwrite(STDERR, "Invalid JSON\n");
  exit(1);
}

usort($rows, function ($a, $b) {
  return intval($b["creditsMinor"]) <=> intval($a["creditsMinor"]);
});

$rank = 1;
foreach ($rows as &$r) {
  $r["rank"] = $rank++;
}
unset($r);

echo json_encode($rows, JSON_UNESCAPED_SLASHES);

