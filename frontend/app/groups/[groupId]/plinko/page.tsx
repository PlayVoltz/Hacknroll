"use client";

import { useEffect, useCallback, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "../../../../lib/api";
import { creditsToMinor, formatCredits } from "../../../../lib/credits";
import { getErrorMessage } from "../../../../lib/errors";
import { PageTitle } from "../../../../components/ui/shell";
import { PlinkoBoard, type Ball } from "../../../../components/plinko/PlinkoBoard";

function parseCreditsInputToMinor(value: string) {
  const v = value.trim();
  if (!v) return null;
  // allow up to 2 decimals
  if (!/^\d+(\.\d{0,2})?$/.test(v)) return null;
  const num = Number(v);
  if (!Number.isFinite(num) || num <= 0) return null;
  return creditsToMinor(num);
}

export default function PlinkoPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.groupId as string;
  type Risk = "low" | "medium" | "high";
  const [balanceMinor, setBalanceMinor] = useState<number>(0);
  const [betInput, setBetInput] = useState("10");
  const betInputRef = useRef(betInput);
  useEffect(() => {
    betInputRef.current = betInput;
  }, [betInput]);
  const [risk, setRisk] = useState<Risk>("medium");
  const [rows, setRows] = useState(12);
  const [balls, setBalls] = useState<Ball[]>([]);
  const [recentResults, setRecentResults] = useState<{ id: number; multiplier: number }[]>([]);
  const [message, setMessage] = useState("");
  const ballIdRef = useRef(0);
  const resultIdRef = useRef(0);

  const getMultipliers = useCallback((rowCount: number, riskLevel: Risk) => {
    const baseMultipliers: Record<number, Record<Risk, number[]>> = {
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
    return baseMultipliers[rowCount]?.[riskLevel] || baseMultipliers[12][riskLevel];
  }, []);

  const multipliers = useMemo(() => getMultipliers(rows, risk), [getMultipliers, rows, risk]);
  const rowOptions = [8, 10, 12, 14, 16];
  const riskOptions: Risk[] = ["low", "medium", "high"];

  async function refreshBalance() {
    try {
      const data = await apiFetch<{ userStats: { balanceMinor: number } }>(
        `/api/groups/${groupId}/activity`,
      );
      setBalanceMinor(data.userStats.balanceMinor);
      setMessage("");
    } catch (err) {
      const status = (err as Error & { status?: number }).status;
      if (status === 401) {
        setMessage("Please login to play Plinko.");
      } else if (status === 403) {
        setMessage("Join this group to play Plinko.");
      } else {
        setMessage(getErrorMessage(err));
      }
    }
  }

  useEffect(() => {
    refreshBalance();
  }, [groupId]);

  const handleDrop = useCallback(() => {
    setMessage("");
    const betMinor = parseCreditsInputToMinor(betInputRef.current);
    if (!betMinor) {
      setMessage("Enter a valid bet (e.g. 10 or 10.5).");
      return;
    }
    if (betMinor > balanceMinor) {
      setMessage("Insufficient balance");
      return;
    }

    const scale = 2;
    const pegSpacingX = 36 * scale;
    const boardWidth = Math.max((rows + 8) * pegSpacingX, (rows + 5) * pegSpacingX);
    const startX = boardWidth / 2;

    // Optimistic balance (we will refresh after settlement)
    setBalanceMinor((prev) => prev - betMinor);

    const newBall: Ball = {
      id: ballIdRef.current++,
      x: startX + (Math.random() - 0.5) * 20 * scale,
      y: 25 * scale,
      vx: (Math.random() - 0.5) * 0.5,
      vy: 0,
      path: [],
      currentRow: 0,
      finished: false,
      finalSlot: null,
      betAmount: betMinor,
    };

    setBalls((prev) => [...prev, newBall]);
  }, [balanceMinor, rows, groupId]);

  const handleBallFinish = useCallback(
    async (ballId: number, slotIndex: number, betMinor: number) => {
      try {
        const data = await apiFetch<{ multiplier: number; payoutMinor: number }>(
          `/api/groups/${groupId}/plinko/play`,
          {
            method: "POST",
            body: JSON.stringify({ betMinor, rows, risk, slotIndex }),
          },
        );
        setRecentResults((prev) => [{ id: resultIdRef.current++, multiplier: data.multiplier }, ...prev.slice(0, 9)]);
        await refreshBalance();
      } catch (err) {
        setMessage(getErrorMessage(err));
        await refreshBalance();
      } finally {
        setTimeout(() => setBalls((prev) => prev.filter((b) => b.id !== ballId)), 300);
      }
    },
    [groupId, rows, risk],
  );

  return (
    <main className="space-y-6">
      <PageTitle
        title="Plinko"
        subtitle="Exact UI/physics/multipliers from the provided build."
        right={
          <button
            onClick={() => router.push(`/groups/${groupId}`)}
            className="rounded-md border border-border px-3 py-2 hover:bg-surface-elevated"
          >
            Back
          </button>
        }
      />

      <div className="min-h-[80vh] bg-black text-white flex flex-col rounded-2xl border border-border overflow-hidden">
        <header className="flex items-center justify-between p-4 border-b border-white/10">
          <h1 className="text-xl font-bold">
            <span className="text-[#38F868]">Plinko</span>
          </h1>
          <div className="text-[#38F868] font-bold">
            {formatCredits(balanceMinor)} credits
          </div>
        </header>

        <div className="p-4 border-b border-white/10 space-y-3">
          <div className="flex items-center justify-center gap-4">
            <span className="text-sm text-gray-400 w-12">Bet</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setBetInput((cur) => {
                    const currentMinor = parseCreditsInputToMinor(cur) ?? creditsToMinor(10);
                    const next = Math.max(1, Math.round((currentMinor / 100) - 10));
                    return String(next);
                  })
                }
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                aria-label="Decrease bet"
              >
                -
              </button>
              <input
                type="number"
                value={betInput}
                onChange={(e) =>
                  setBetInput(e.target.value)
                }
                className="w-24 bg-white/10 rounded-lg px-3 py-2 text-center font-medium"
                min={1}
              />
              <button
                onClick={() =>
                  setBetInput((cur) => {
                    const currentMinor = parseCreditsInputToMinor(cur) ?? creditsToMinor(10);
                    const next = Math.max(1, Math.round((currentMinor / 100) + 10));
                    return String(next);
                  })
                }
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                aria-label="Increase bet"
              >
                +
              </button>
            </div>
          </div>

          <div className="flex items-center justify-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Risk</span>
              <div className="flex gap-1">
                {riskOptions.map((r) => (
                  <button
                    key={r}
                    onClick={() => setRisk(r)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      risk === r
                        ? "bg-[#38F868] text-black"
                        : "bg-white/10 text-gray-400 hover:text-white"
                    }`}
                  >
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Rows</span>
              <div className="flex gap-1">
                {rowOptions.map((r) => (
                  <button
                    key={r}
                    onClick={() => setRows(r)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      rows === r
                        ? "bg-[#38F868] text-black"
                        : "bg-white/10 text-gray-400 hover:text-white"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleDrop}
            disabled={(() => {
              const betMinor = parseCreditsInputToMinor(betInput);
              if (!betMinor) return true;
              return betMinor > balanceMinor;
            })()}
            className="w-full py-3 bg-[#38F868] text-black font-bold rounded-xl hover:bg-[#2dd655] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Drop Ball
          </button>

          {message ? <p className="text-sm text-destructive">{message}</p> : null}
        </div>

        <div className="flex-1 p-4 min-h-0 overflow-hidden">
          <PlinkoBoard
            rows={rows}
            multipliers={multipliers}
            balls={balls}
            onBallFinish={handleBallFinish}
          />
        </div>

        <div className="p-4 border-t border-white/10">
          <p className="text-sm text-gray-400 mb-2">Recent Results</p>
          <div className="flex gap-2 flex-wrap min-h-[32px]">
            {recentResults.length === 0 ? (
              <span className="text-sm text-gray-500">No results yet</span>
            ) : (
              recentResults.map((r) => (
                <span
                  key={r.id}
                  className={`px-3 py-1 rounded-lg text-sm font-bold ${
                    r.multiplier >= 10
                      ? "bg-[#38F868] text-black"
                      : r.multiplier >= 2
                      ? "bg-[#38F868]/50 text-white"
                      : "bg-white/10 text-gray-300"
                  }`}
                >
                  {r.multiplier}x
                </span>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
