"use client";

import { useState } from "react";

export function AutoTab() {
  // Zip UI parity (this is a UI-only stub; it doesn't drive the real game yet)
  const [numberOfHands, setNumberOfHands] = useState(10);
  const [strategy, setStrategy] = useState("basic");
  const [stopOnProfit, setStopOnProfit] = useState(false);
  const [stopOnLoss, setStopOnLoss] = useState(false);
  const [profitAmount, setProfitAmount] = useState(1000);
  const [lossAmount, setLossAmount] = useState(500);
  const [isRunning, setIsRunning] = useState(false);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="text-sm font-medium text-muted-foreground">Number of hands</div>
        <input
          type="number"
          value={numberOfHands}
          onChange={(e) => setNumberOfHands(Number.parseInt(e.target.value) || 0)}
          className="w-full bg-deep-surface border border-border rounded-md px-3 py-2 font-mono"
          disabled={isRunning}
        />
      </div>

      <div className="space-y-2">
        <div className="text-sm font-medium text-muted-foreground">Strategy</div>
        <select
          value={strategy}
          onChange={(e) => setStrategy(e.target.value)}
          className="w-full bg-deep-surface border border-border rounded-md px-3 py-2"
          disabled={isRunning}
        >
          <option value="basic">Basic Strategy</option>
          <option value="conservative">Conservative</option>
          <option value="aggressive">Aggressive</option>
        </select>
      </div>

      <div className="space-y-4">
        <label className="flex items-center justify-between text-sm">
          <span>Stop on profit</span>
          <input
            type="checkbox"
            checked={stopOnProfit}
            onChange={(e) => setStopOnProfit(e.target.checked)}
            disabled={isRunning}
            className="h-4 w-4 accent-primary"
          />
        </label>
        {stopOnProfit ? (
          <div className="relative">
            <input
              type="number"
              value={profitAmount}
              onChange={(e) => setProfitAmount(Number.parseInt(e.target.value) || 0)}
              className="w-full bg-deep-surface border border-border rounded-md px-3 py-2 pr-16 font-mono"
              disabled={isRunning}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">credits</span>
          </div>
        ) : null}

        <label className="flex items-center justify-between text-sm">
          <span>Stop on loss</span>
          <input
            type="checkbox"
            checked={stopOnLoss}
            onChange={(e) => setStopOnLoss(e.target.checked)}
            disabled={isRunning}
            className="h-4 w-4 accent-primary"
          />
        </label>
        {stopOnLoss ? (
          <div className="relative">
            <input
              type="number"
              value={lossAmount}
              onChange={(e) => setLossAmount(Number.parseInt(e.target.value) || 0)}
              className="w-full bg-deep-surface border border-border rounded-md px-3 py-2 pr-16 font-mono"
              disabled={isRunning}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">credits</span>
          </div>
        ) : null}
      </div>

      {isRunning ? (
        <div className="w-full flex items-center justify-center py-2 bg-primary/10 text-primary border border-primary/30 rounded-md text-sm font-semibold">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse mr-2" />
          Autobet running...
        </div>
      ) : null}

      <button
        onClick={() => setIsRunning(!isRunning)}
        className={`w-full h-12 font-bold rounded-md ${
          isRunning ? "bg-destructive text-white hover:bg-destructive/90" : "bg-primary text-primary-foreground hover:bg-primary/90 neon-glow"
        }`}
      >
        {isRunning ? "STOP" : "START AUTOBET"}
      </button>
    </div>
  );
}

