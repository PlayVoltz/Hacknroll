import crypto from "crypto";

export type MinesState = {
  betMinor: number;
  mineCount: number;
  minePositions: number[];
  revealed: number[];
  multiplier: number;
  status: "ACTIVE" | "BUST" | "CASHED";
};

export function generateMines(mineCount: number) {
  const positions = new Set<number>();
  while (positions.size < mineCount) {
    positions.add(crypto.randomInt(0, 25));
  }
  return Array.from(positions.values());
}

export function computeMultiplier(mineCount: number, safeReveals: number) {
  const safeTiles = 25 - mineCount;
  const remainingSafe = safeTiles - safeReveals;
  if (remainingSafe <= 0) {
    return safeTiles > 0 ? safeTiles : 1;
  }
  const ratio = safeTiles / remainingSafe;
  return Number(ratio.toFixed(2));
}

export function revealTile(state: MinesState, position: number) {
  if (state.status !== "ACTIVE") {
    throw new Error("Round finished");
  }
  if (state.revealed.includes(position)) {
    return state;
  }

  const nextRevealed = [...state.revealed, position];
  if (state.minePositions.includes(position)) {
    return { ...state, revealed: nextRevealed, status: "BUST" as const };
  }

  const multiplier = computeMultiplier(state.mineCount, nextRevealed.length);
  return { ...state, revealed: nextRevealed, multiplier };
}

export function cashOut(state: MinesState) {
  if (state.status !== "ACTIVE") {
    throw new Error("Round finished");
  }
  const payoutMinor = Math.floor(state.betMinor * state.multiplier);
  return {
    state: { ...state, status: "CASHED" as const },
    payoutMinor,
  };
}
