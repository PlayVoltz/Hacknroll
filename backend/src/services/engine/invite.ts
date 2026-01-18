import { spawnSync } from "child_process";
import path from "path";
import crypto from "crypto";

const ENGINE = process.env.INVITE_ENGINE || "ts";
const ENGINE_BIN = process.env.INVITE_ENGINE_BIN || "lua";
const ENGINE_SCRIPT =
  process.env.INVITE_ENGINE_SCRIPT ||
  path.join(process.cwd(), "engines", "lua", "invite", "invite.lua");

function resolveEngineBin() {
  if (process.platform === "win32" && !ENGINE_BIN.endsWith(".exe")) {
    return `${ENGINE_BIN}.exe`;
  }
  return ENGINE_BIN;
}

function runLua(): string | null {
  const bin = resolveEngineBin();
  const args = ENGINE_SCRIPT ? [ENGINE_SCRIPT] : [];
  const result = spawnSync(bin, args, {
    input: "",
    encoding: "utf8",
    maxBuffer: 1024 * 1024,
  });

  if (result.error || result.status !== 0 || !result.stdout) {
    return null;
  }

  try {
    const parsed = JSON.parse(result.stdout) as { code?: string };
    if (!parsed.code || typeof parsed.code !== "string") return null;
    return parsed.code;
  } catch {
    return null;
  }
}

export function generateInviteCodeEngine() {
  if (ENGINE === "lua") {
    const result = runLua();
    if (result) return result;
  }

  return crypto.randomBytes(4).toString("hex").toUpperCase();
}
