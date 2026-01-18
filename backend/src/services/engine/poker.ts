import { spawnSync } from "child_process";
import path from "path";
import { buildDeck as buildDeckTs, draw as drawTs, type PokerCard } from "../games/poker";

const ENGINE = process.env.POKER_ENGINE || "ts";
const ENGINE_BIN =
  process.env.POKER_ENGINE_BIN ||
  path.join(process.cwd(), "engines", "d", "poker", "poker");

type DrawResult = { card: PokerCard; deck: PokerCard[] };

function resolveEngineBin() {
  if (process.platform === "win32" && !ENGINE_BIN.endsWith(".exe")) {
    return `${ENGINE_BIN}.exe`;
  }
  return ENGINE_BIN;
}

function runD(payload: Record<string, unknown>): any | null {
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
    return JSON.parse(result.stdout);
  } catch {
    return null;
  }
}

export function buildDeckEngine(): PokerCard[] {
  if (ENGINE === "d") {
    const result = runD({ action: "build_deck" });
    if (result && Array.isArray(result.deck)) {
      return result.deck as PokerCard[];
    }
  }

  return buildDeckTs();
}

export function drawEngine(deck: PokerCard[]): DrawResult {
  if (ENGINE === "d") {
    const result = runD({ action: "draw", deck });
    if (result && result.card && Array.isArray(result.deck)) {
      return { card: result.card as PokerCard, deck: result.deck as PokerCard[] };
    }
  }

  return { card: drawTs(deck), deck };
}

export function pickWinnerEngine(contenders: string[]): string {
  if (ENGINE === "d") {
    const result = runD({ action: "pick_winner", contenders });
    if (result && typeof result.winnerId === "string") {
      return result.winnerId;
    }
  }

  return contenders[Math.floor(Math.random() * contenders.length)] || contenders[0] || "";
}
