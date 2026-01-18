#!/usr/bin/env bash
set -euo pipefail

# Leaderboard sorting (highest balance first) using jq.
# Input: JSON array on stdin.

jq 'sort_by(.creditsMinor) | reverse | to_entries | map(.value + {rank: (.key + 1)})'

