"use client";

import type { HistoryEntry } from "../../lib/blackjack-types";

export function HighlightCard({ balance, history }: { balance: number; history: HistoryEntry[] }) {
  const last20 = history.slice(-20);
  const wins = last20.filter((h) => h.result === "win" || h.result === "blackjack").length;
  const losses = last20.filter((h) => h.result === "lose" || h.result === "bust").length;
  const pushes = last20.filter((h) => h.result === "push").length;

  return (
    <div className="pastel-glass rounded-2xl p-4 text-black">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-black/10 flex items-center justify-center">
            <span className="text-xs font-bold">GRP</span>
          </div>
          <div>
            <p className="text-xs opacity-70">Active Group</p>
            <p className="font-semibold">DarePot</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-black/10 flex items-center justify-center">
            <span className="text-xs font-bold">$$</span>
          </div>
          <div>
            <p className="text-xs opacity-70">Your Balance</p>
            <p className="font-semibold font-mono">{balance.toLocaleString()} credits</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-black/10 flex items-center justify-center">
            <span className="text-xs font-bold">20</span>
          </div>
          <div>
            <p className="text-xs opacity-70">Last 20 hands</p>
            <p className="font-semibold">
              <span className="text-green-700">{wins}W</span>
              {" / "}
              <span className="text-red-700">{losses}L</span>
              {" / "}
              <span>{pushes}P</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

