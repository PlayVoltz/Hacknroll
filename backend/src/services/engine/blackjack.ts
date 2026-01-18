import { spawnSync } from "child_process";
import path from "path";
import { playBlackjack as playBlackjackTs, type BlackjackResult } from "../games/blackjack";

const ENGINE = process.env.BLACKJACK_ENGINE || "ts";
const ENGINE_BIN =
  process.env.BLACKJACK_ENGINE_BIN ||
  path.join(process.cwd(), "engines", "nim", "blackjack", "blackjack");

function resolveEngineBin() {
  if (process.platform === "win32" && !ENGINE_BIN.endsWith(".exe")) {
    return `${ENGINE_BIN}.exe`;
  }
  return ENGINE_BIN;
}

function runNim(betMinor: number): BlackjackResult | null {
  const bin = resolveEngineBin();
  const payload = JSON.stringify({ betMinor });
  const result = spawnSync(bin, [], {
    input: payload,
    encoding: "utf8",
    maxBuffer: 1024 * 1024,
  });

  if (result.error || result.status !== 0 || !result.stdout) {
    return null;
  }

  try {
    const parsed = JSON.parse(result.stdout) as BlackjackResult;
    if (!parsed || !Array.isArray(parsed.playerHand) || !Array.isArray(parsed.dealerHand)) {
      return null;
    }
    if (typeof parsed.playerTotal !== "number" || typeof parsed.dealerTotal !== "number") {
      return null;
    }
    if (!["WIN", "LOSE", "PUSH"].includes(parsed.outcome)) {
      return null;
    }
    if (typeof parsed.payoutMinor !== "number") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function playBlackjackEngine(betMinor: number): BlackjackResult {
  if (ENGINE === "nim") {
    const result = runNim(betMinor);
    if (result) return result;
  }

  return playBlackjackTs(betMinor);
}
