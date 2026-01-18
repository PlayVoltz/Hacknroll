# Polyglot Showcase

This repo’s **core app** stays in TypeScript (Next.js frontend + Express backend).

For the hackathon **polyglot** challenge, this folder contains **equivalent implementations** of a few small, self-contained algorithms used in the app, rewritten across many languages. These files are intentionally isolated so they **don’t risk breaking** the main product.

## What’s included

### 1) Leaderboard sorting (highest balance first)
- Reference: `backend/src/services/groupStats.ts` (`getLeaderboard` ordering)
- Implementations:
  - `leaderboard_sort.py` (Python)
  - `leaderboard_sort.go` (Go)
  - `leaderboard_sort.rs` (Rust)
  - `leaderboard_sort.rb` (Ruby)
  - `leaderboard_sort.php` (PHP)
  - `leaderboard_sort.sh` (Bash + `jq`)
  - `leaderboard_sort.pl` (Perl)
  - `leaderboard_sort.lua` (Lua)
  - `leaderboard_sort.r` (R)
  - `leaderboard_sort.jl` (Julia)
  - `leaderboard_sort.hs` (Haskell)
  - `leaderboard_sort.nim` (Nim)
  - `leaderboard_sort.zig` (Zig)
  - `leaderboard_sort.kt` (Kotlin)

### 2) Poker deck generation + draw
- Reference: `backend/src/services/games/poker.ts`
- Implementations:
  - `poker_deck.py` (Python)
  - `poker_deck.go` (Go)
  - `poker_deck.rs` (Rust)
  - `poker_deck.java` (Java)
  - `poker_deck.cs` (C#)

### 3) Roulette slice index from wheel angle
- Reference: logic used to keep frontend wheel + backend result consistent
- Implementations:
  - `roulette_slice.py` (Python)
  - `roulette_slice.go` (Go)
  - `roulette_slice.rs` (Rust)

### 4) SQL
- `sql/leaderboard.sql`: leaderboard query pattern (desc order)

### 5) “Rare” languages
- `brainfuck_hello.bf` (Brainfuck): simple output demo (polyglot points)

## Notes
- These scripts are “drop-in translations” for the hackathon goal; they’re not required for app runtime.
- If you want, we can wire a small `npm run polyglot:*` runner later, but that depends on which runtimes are available on your demo machine.

