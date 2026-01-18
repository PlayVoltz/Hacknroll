export type PlinkoRisk = "low" | "medium" | "high";

const baseMultipliers: Record<number, Record<PlinkoRisk, number[]>> = {
  8: {
    low: [4, 1.5, 1.2, 0.8, 0.5, 0.8, 1.2, 1.5, 4],
    medium: [8, 4, 1.5, 0.7, 0.2, 0.7, 1.5, 4, 8],
    high: [20, 8, 4, 1.5, 0, 1.5, 4, 8, 20],
  },
  10: {
    low: [6, 3, 1.5, 1.2, 0.8, 0.5, 0.8, 1.2, 1.5, 3, 6],
    medium: [12, 6, 3, 1.5, 0.7, 0.2, 0.7, 1.5, 3, 6, 12],
    high: [40, 12, 6, 3, 1.5, 0, 1.5, 3, 6, 12, 40],
  },
  12: {
    low: [8, 4, 2.5, 1.5, 1.2, 0.8, 0.5, 0.8, 1.2, 1.5, 2.5, 4, 8],
    medium: [20, 8, 4, 2.5, 1.5, 0.7, 0.2, 0.7, 1.5, 2.5, 4, 8, 20],
    high: [80, 20, 8, 4, 2.5, 0.5, 0, 0.5, 2.5, 4, 8, 20, 80],
  },
  14: {
    low: [12, 6, 4, 2.5, 1.8, 1.2, 0.8, 0.5, 0.8, 1.2, 1.8, 2.5, 4, 6, 12],
    medium: [40, 12, 6, 4, 2.5, 1.5, 0.7, 0.2, 0.7, 1.5, 2.5, 4, 6, 12, 40],
    high: [160, 40, 12, 6, 4, 2, 0.5, 0, 0.5, 2, 4, 6, 12, 40, 160],
  },
  16: {
    low: [16, 8, 6, 4, 2.5, 1.8, 1.2, 0.8, 0.5, 0.8, 1.2, 1.8, 2.5, 4, 6, 8, 16],
    medium: [80, 20, 12, 6, 4, 2.5, 1.5, 0.7, 0.2, 0.7, 1.5, 2.5, 4, 6, 12, 20, 80],
    high: [400, 80, 20, 12, 6, 4, 2, 0.5, 0, 0.5, 2, 4, 6, 12, 20, 80, 400],
  },
};

export function getPlinkoMultipliers(rows: number, risk: PlinkoRisk) {
  return baseMultipliers[rows]?.[risk] || baseMultipliers[12][risk];
}

export function settlePlinko(params: {
  betMinor: number;
  rows: number;
  risk: PlinkoRisk;
  slotIndex: number;
}) {
  const { betMinor, rows, risk, slotIndex } = params;
  const multipliers = getPlinkoMultipliers(rows, risk);
  if (slotIndex < 0 || slotIndex >= multipliers.length) {
    throw new Error("Invalid slot");
  }
  const multiplier = multipliers[slotIndex];
  const payoutMinor = Math.floor(betMinor * multiplier);
  return { multiplier, payoutMinor };
}
