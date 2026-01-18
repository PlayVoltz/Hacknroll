import { spawnSync } from "child_process";
import path from "path";
import { settlePlinko as settlePlinkoTs, type PlinkoRisk } from "../games/plinko";

const ENGINE = process.env.PLINKO_ENGINE || "ts";
const ENGINE_BIN =
  process.env.PLINKO_ENGINE_BIN ||
  path.join(process.cwd(), "engines", "crystal", "plinko", "plinko");

function resolveEngineBin() {
  if (process.platform === "win32" && !ENGINE_BIN.endsWith(".exe")) {
    return `${ENGINE_BIN}.exe`;
  }
  return ENGINE_BIN;
}

type PlinkoInput = {
  betMinor: number;
  rows: number;
  risk: PlinkoRisk;
  slotIndex: number;
};

type PlinkoOutput = {
  multiplier: number;
  payoutMinor: number;
};

function runCrystal(input: PlinkoInput): PlinkoOutput | null {
  const bin = resolveEngineBin();
  const result = spawnSync(bin, [], {
    input: JSON.stringify(input),
    encoding: "utf8",
    maxBuffer: 1024 * 1024,
  });

  if (result.error || result.status !== 0 || !result.stdout) {
    return null;
  }

  try {
    const parsed = JSON.parse(result.stdout) as PlinkoOutput;
    if (typeof parsed.multiplier !== "number") return null;
    if (typeof parsed.payoutMinor !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function settlePlinkoEngine(params: PlinkoInput): PlinkoOutput {
  if (ENGINE === "crystal") {
    const result = runCrystal(params);
    if (result) return result;
  }

  return settlePlinkoTs(params);
}
