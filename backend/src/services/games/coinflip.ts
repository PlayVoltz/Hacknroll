import crypto from "crypto";

export type CoinflipResult = {
  result: "heads" | "tails";
  won: boolean;
  payoutMinor: number;
};

export function playCoinflip(choice: "heads" | "tails", betMinor: number) {
  const result = crypto.randomInt(0, 2) === 0 ? "heads" : "tails";
  const won = result === choice;
  const payoutMinor = won ? betMinor * 2 : 0;
  return { result, won, payoutMinor } as CoinflipResult;
}
