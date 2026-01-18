import { spawnSync } from "child_process";
import path from "path";
import { spinRoulette as spinRouletteTs, type RouletteResult } from "../games/roulette";

const ENGINE = process.env.ROULETTE_ENGINE || "ts";
const ENGINE_BIN =
  process.env.ROULETTE_ENGINE_BIN ||
  path.join(process.cwd(), "engines", "ocaml", "roulette", "roulette");

function resolveEngineBin() {
  if (process.platform === "win32" && !ENGINE_BIN.endsWith(".exe")) {
    return `${ENGINE_BIN}.exe`;
  }
  return ENGINE_BIN;
}

function runOcaml(): RouletteResult | null {
  const bin = resolveEngineBin();
  const result = spawnSync(bin, [], {
    input: "",
    encoding: "utf8",
    maxBuffer: 1024 * 1024,
  });

  if (result.error || result.status !== 0 || !result.stdout) {
    return null;
  }

  try {
    const parsed = JSON.parse(result.stdout) as RouletteResult;
    if (!parsed) return null;
    if (!["red", "black", "green"].includes(parsed.color)) return null;
    if (typeof parsed.stopRotationDeg !== "number") return null;
    if (typeof parsed.wheelIndex !== "number") return null;
    if (typeof parsed.winningNumber !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function spinRouletteEngine(): RouletteResult {
  if (ENGINE === "ocaml") {
    const result = runOcaml();
    if (result) return result;
  }

  return spinRouletteTs();
}
