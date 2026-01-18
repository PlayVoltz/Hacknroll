import crypto from "crypto";

export type RouletteColor = "red" | "black" | "green";

export type RouletteResult = {
  color: RouletteColor;
  // Where the wheel should stop (degrees), used by the UI animation.
  // 0deg means the 0/green slice is under the pointer (top).
  stopRotationDeg: number;
  // Wheel index (0..36) in authentic European wheel order.
  wheelIndex: number;
  // Winning number at wheelIndex.
  winningNumber: number;
};

export type RouletteBet =
  | { betType: "red" | "black" | "green"; selection: null }
  | { betType: "straight"; selection: number };

// Authentic European wheel order starting from 0 and going clockwise.
const WHEEL_NUMBERS = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5,
  24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
];

const RED_NUMBERS = new Set([
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
]);

function getNumberColor(num: number): RouletteColor {
  if (num === 0) return "green";
  return RED_NUMBERS.has(num) ? "red" : "black";
}

export function spinRoulette(): RouletteResult {
  const sliceCount = 37;
  const sliceSize = 360 / sliceCount;
  // Choose a slice index, then choose a random offset INSIDE the slice (never on the boundary).
  const wheelIndex = crypto.randomInt(0, sliceCount);
  const epsilon = 0.35; // degrees away from edges to avoid "between colors"
  const jitterRange = sliceSize / 2 - epsilon;
  const jitter = (crypto.randomInt(0, 100000) / 100000) * (jitterRange * 2) - jitterRange;

  // We define sliceIndex as the slice under the pointer AFTER rotation.
  // Pointer sees original angle (-rotation). Let normalized be that angle in [0,360).
  const normalized = wheelIndex * sliceSize + sliceSize / 2 + jitter;
  const stopRotationDeg = ((360 - (normalized % 360)) + 360) % 360;

  const winningNumber = WHEEL_NUMBERS[wheelIndex] ?? 0;
  const color = getNumberColor(winningNumber);

  return { color, stopRotationDeg, wheelIndex, winningNumber };
}

export function resolveRouletteBet(
  bet: RouletteBet,
  result: RouletteResult,
  amountMinor: number,
) {
  let won = false;
  if (bet.betType === "straight") {
    won = result.winningNumber === bet.selection;
    return { won, payoutMinor: won ? amountMinor * 36 : 0 };
  }

  if (bet.betType === "red" || bet.betType === "black") {
    won = result.color === bet.betType;
    return { won, payoutMinor: won ? amountMinor * 2 : 0 };
  }

  if (bet.betType === "green") {
    won = result.color === "green";
    return { won, payoutMinor: won ? amountMinor * 14 : 0 };
  }

  return { won: false, payoutMinor: 0 };
}
