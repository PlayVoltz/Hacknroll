import { spawnSync } from "child_process";
import path from "path";
import {
  cashOut as cashOutTs,
  generateMines as generateMinesTs,
  revealTile as revealTileTs,
  type MinesState,
} from "../games/mines";

const ENGINE = process.env.MINES_ENGINE || "ts";
const ENGINE_BIN =
  process.env.MINES_ENGINE_BIN ||
  path.join(process.cwd(), "engines", "prolog", "mines", "mines");

type PrologResult =
  | { minePositions: number[] }
  | { state: MinesState; payoutMinor: number }
  | MinesState;

function resolveEngineBin() {
  if (process.platform === "win32" && !ENGINE_BIN.endsWith(".exe")) {
    return `${ENGINE_BIN}.exe`;
  }
  return ENGINE_BIN;
}

function runProlog(payload: Record<string, unknown>): PrologResult | null {
  const bin = resolveEngineBin();
  const result = spawnSync(bin, [], {
    input: JSON.stringify(payload),
    encoding: "utf8",
    maxBuffer: 1024 * 1024,
  });

  if (result.error || result.status !== 0 || !result.stdout) {
    return null;
  }

  try {
    return JSON.parse(result.stdout) as PrologResult;
  } catch {
    return null;
  }
}

export function generateMinesEngine(mineCount: number): number[] {
  if (ENGINE === "prolog") {
    const result = runProlog({ action: "generate_mines", mineCount });
    if (result && "minePositions" in result && Array.isArray(result.minePositions)) {
      return result.minePositions as number[];
    }
  }

  return generateMinesTs(mineCount);
}

export function revealTileEngine(state: MinesState, position: number): MinesState {
  if (ENGINE === "prolog") {
    const result = runProlog({ action: "reveal_tile", state, position });
    if (result && typeof (result as MinesState).status === "string") {
      return result as MinesState;
    }
  }

  return revealTileTs(state, position);
}

export function cashOutEngine(state: MinesState): { state: MinesState; payoutMinor: number } {
  if (ENGINE === "prolog") {
    const result = runProlog({ action: "cash_out", state });
    if (
      result &&
      "state" in result &&
      typeof result.state === "object" &&
      typeof result.payoutMinor === "number"
    ) {
      return { state: result.state as MinesState, payoutMinor: result.payoutMinor };
    }
  }

  return cashOutTs(state);
}
