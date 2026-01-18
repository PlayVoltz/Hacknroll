"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Shuffle } from "lucide-react"

interface ControlPanelProps {
  betAmount: number
  onBetAmountChange: (amount: number) => void
  selectedSide: "heads" | "tails" | "random"
  onSideChange: (side: "heads" | "tails" | "random") => void
  streakMode: boolean
  onStreakModeChange: (enabled: boolean) => void
  flipsPerStreak: number
  onFlipsPerStreakChange: (flips: number) => void
  onBet: () => void
  onFlipAgain: () => void
  onCashOut: () => void
  isFlipping: boolean
  hasWon: boolean | null
  balance: number
  currentWinnings: number
}

const quickChips = [10, 50, 100, 250, 500]

export function ControlPanel({
  betAmount,
  onBetAmountChange,
  selectedSide,
  onSideChange,
  streakMode,
  onStreakModeChange,
  flipsPerStreak,
  onFlipsPerStreakChange,
  onBet,
  onFlipAgain,
  onCashOut,
  isFlipping,
  hasWon,
  balance,
  currentWinnings,
}: ControlPanelProps) {
  const [activeTab, setActiveTab] = useState<"manual" | "auto">("manual")
  const [autoBets, setAutoBets] = useState(10)
  const [onWinAction, setOnWinAction] = useState<"reset" | "increase">("reset")
  const [onLossAction, setOnLossAction] = useState<"reset" | "increase">("reset")
  const [winIncrease, setWinIncrease] = useState(50)
  const [lossIncrease, setLossIncrease] = useState(50)
  const [stopOnProfit, setStopOnProfit] = useState(false)
  const [stopOnLoss, setStopOnLoss] = useState(false)
  const [profitLimit, setProfitLimit] = useState(1000)
  const [lossLimit, setLossLimit] = useState(500)
  const [isAutoRunning, setIsAutoRunning] = useState(false)

  const isInvalidBet = betAmount <= 0 || betAmount > balance

  return (
    <div className="bg-[#0C0F11] rounded-[20px] border border-[#2a2a2a] p-5 w-full lg:w-[340px] flex-shrink-0">
      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        <button
          onClick={() => setActiveTab("manual")}
          className={cn(
            "flex-1 py-2.5 rounded-xl text-sm font-medium transition-all",
            activeTab === "manual" ? "bg-[#38F868]/10 text-[#38F868]" : "text-[#9DA6A3] hover:bg-[#211E21]",
          )}
        >
          Manual
        </button>
        <button
          onClick={() => setActiveTab("auto")}
          className={cn(
            "flex-1 py-2.5 rounded-xl text-sm font-medium transition-all",
            activeTab === "auto" ? "bg-[#38F868]/10 text-[#38F868]" : "text-[#9DA6A3] hover:bg-[#211E21]",
          )}
        >
          Auto
        </button>
      </div>

      {activeTab === "manual" ? (
        <div className="space-y-5">
          {/* Bet Amount */}
          <div>
            <label className="text-xs font-medium text-[#778184] uppercase tracking-wider mb-2 block">Bet Amount</label>
            <div className="relative">
              <input
                type="number"
                value={betAmount}
                onChange={(e) => onBetAmountChange(Number(e.target.value))}
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white font-medium focus:outline-none focus:border-[#38F868] focus:ring-1 focus:ring-[#38F868]/50 transition-all"
                disabled={isFlipping}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#778184] text-sm">credits</span>
            </div>

            {/* Quick Chips */}
            <div className="flex gap-2 mt-3">
              {quickChips.map((chip) => (
                <button
                  key={chip}
                  onClick={() => onBetAmountChange(chip)}
                  disabled={isFlipping}
                  className="flex-1 py-2 rounded-lg bg-[#211E21] text-xs font-medium text-[#9DA6A3] hover:bg-[#423941] hover:text-white transition-all disabled:opacity-50"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Utility Buttons */}
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => onBetAmountChange(Math.floor(betAmount / 2))}
                disabled={isFlipping}
                className="flex-1 py-2 rounded-lg bg-[#211E21] text-xs font-medium text-[#9DA6A3] hover:bg-[#423941] hover:text-white transition-all disabled:opacity-50"
              >
                ½
              </button>
              <button
                onClick={() => onBetAmountChange(betAmount * 2)}
                disabled={isFlipping}
                className="flex-1 py-2 rounded-lg bg-[#211E21] text-xs font-medium text-[#9DA6A3] hover:bg-[#423941] hover:text-white transition-all disabled:opacity-50"
              >
                2×
              </button>
              <button
                onClick={() => onBetAmountChange(balance)}
                disabled={isFlipping}
                className="flex-1 py-2 rounded-lg bg-[#211E21] text-xs font-medium text-[#9DA6A3] hover:bg-[#423941] hover:text-white transition-all disabled:opacity-50"
              >
                Max
              </button>
            </div>
          </div>

          {/* Pick Side */}
          <div>
            <label className="text-xs font-medium text-[#778184] uppercase tracking-wider mb-2 block">Pick Side</label>
            <div className="flex gap-2">
              <button
                onClick={() => onSideChange("heads")}
                disabled={isFlipping}
                className={cn(
                  "flex-1 py-3 rounded-xl text-sm font-medium transition-all border",
                  selectedSide === "heads"
                    ? "bg-[#F8C840]/10 border-[#F8C840]/50 text-[#F8C840]"
                    : "bg-[#211E21] border-transparent text-[#9DA6A3] hover:bg-[#423941]",
                )}
              >
                Heads
              </button>
              <button
                onClick={() => onSideChange("tails")}
                disabled={isFlipping}
                className={cn(
                  "flex-1 py-3 rounded-xl text-sm font-medium transition-all border",
                  selectedSide === "tails"
                    ? "bg-[#48B0E8]/10 border-[#48B0E8]/50 text-[#48B0E8]"
                    : "bg-[#211E21] border-transparent text-[#9DA6A3] hover:bg-[#423941]",
                )}
              >
                Tails
              </button>
              <button
                onClick={() => onSideChange("random")}
                disabled={isFlipping}
                className={cn(
                  "flex-1 py-3 rounded-xl text-sm font-medium transition-all border flex items-center justify-center gap-1.5",
                  selectedSide === "random"
                    ? "bg-[#B81098]/10 border-[#B81098]/50 text-[#B81098]"
                    : "bg-[#211E21] border-transparent text-[#9DA6A3] hover:bg-[#423941]",
                )}
              >
                <Shuffle className="w-4 h-4" />
                Random
              </button>
            </div>
          </div>

          {/* Streak Mode */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-[#778184] uppercase tracking-wider">Streak Mode</label>
              <button
                onClick={() => onStreakModeChange(!streakMode)}
                disabled={isFlipping}
                className={cn(
                  "w-11 h-6 rounded-full transition-all relative",
                  streakMode ? "bg-[#38F868]" : "bg-[#423941]",
                )}
              >
                <span
                  className={cn(
                    "absolute top-1 w-4 h-4 rounded-full bg-white transition-all",
                    streakMode ? "left-6" : "left-1",
                  )}
                />
              </button>
            </div>

            {streakMode && (
              <div className="mt-3 p-3 rounded-xl bg-[#211E21]/50 space-y-3">
                <div>
                  <label className="text-xs text-[#778184] mb-1.5 block">Flips per streak</label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={flipsPerStreak}
                    onChange={(e) => onFlipsPerStreakChange(Number(e.target.value))}
                    className="w-full accent-[#38F868]"
                    disabled={isFlipping}
                  />
                  <div className="flex justify-between text-xs text-[#9DA6A3] mt-1">
                    <span>1</span>
                    <span className="text-white font-medium">{flipsPerStreak}</span>
                    <span>10</span>
                  </div>
                </div>
                <p className="text-xs text-[#778184]">Cashout anytime to bank winnings</p>
              </div>
            )}
          </div>

          {/* CTA Buttons */}
          {hasWon === true && currentWinnings > 0 ? (
            <div className="flex gap-3">
              <button
                onClick={onFlipAgain}
                disabled={isFlipping}
                className="flex-1 py-4 rounded-xl text-sm font-bold transition-all border-2 border-[#38F868] text-[#38F868] hover:bg-[#38F868]/10 disabled:opacity-50"
              >
                FLIP AGAIN
              </button>
              <button
                onClick={onCashOut}
                disabled={isFlipping}
                className="flex-1 py-4 rounded-xl text-sm font-bold transition-all bg-[#38F868] text-black hover:bg-[#40F870] hover:shadow-[0_0_30px_rgba(56,248,104,0.4)] disabled:opacity-50"
              >
                CASH OUT
              </button>
            </div>
          ) : (
            <button
              onClick={onBet}
              disabled={isFlipping || isInvalidBet}
              className={cn(
                "w-full py-4 rounded-xl text-base font-bold transition-all",
                isInvalidBet
                  ? "bg-[#423941] text-[#778184] cursor-not-allowed"
                  : "bg-[#38F868] text-black hover:bg-[#40F870] hover:shadow-[0_0_30px_rgba(56,248,104,0.4)]",
              )}
            >
              {isFlipping ? "FLIPPING..." : "BET"}
            </button>
          )}

          {isInvalidBet && betAmount > 0 && <p className="text-xs text-[#E04890] text-center">Insufficient balance</p>}
        </div>
      ) : (
        /* Auto Tab */
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-[#778184] uppercase tracking-wider mb-2 block">
              Number of Bets
            </label>
            <input
              type="number"
              value={autoBets}
              onChange={(e) => setAutoBets(Number(e.target.value))}
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white font-medium focus:outline-none focus:border-[#38F868] focus:ring-1 focus:ring-[#38F868]/50 transition-all"
              disabled={isAutoRunning}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-[#778184] uppercase tracking-wider mb-2 block">On Win</label>
            <div className="flex gap-2">
              <button
                onClick={() => setOnWinAction("reset")}
                className={cn(
                  "flex-1 py-2 rounded-lg text-xs font-medium transition-all",
                  onWinAction === "reset" ? "bg-[#38F868]/10 text-[#38F868]" : "bg-[#211E21] text-[#9DA6A3]",
                )}
              >
                Reset
              </button>
              <button
                onClick={() => setOnWinAction("increase")}
                className={cn(
                  "flex-1 py-2 rounded-lg text-xs font-medium transition-all",
                  onWinAction === "increase" ? "bg-[#38F868]/10 text-[#38F868]" : "bg-[#211E21] text-[#9DA6A3]",
                )}
              >
                Increase
              </button>
            </div>
            {onWinAction === "increase" && (
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="number"
                  value={winIncrease}
                  onChange={(e) => setWinIncrease(Number(e.target.value))}
                  className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#38F868]"
                />
                <span className="text-[#778184] text-sm">%</span>
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-[#778184] uppercase tracking-wider mb-2 block">On Loss</label>
            <div className="flex gap-2">
              <button
                onClick={() => setOnLossAction("reset")}
                className={cn(
                  "flex-1 py-2 rounded-lg text-xs font-medium transition-all",
                  onLossAction === "reset" ? "bg-[#E04890]/10 text-[#E04890]" : "bg-[#211E21] text-[#9DA6A3]",
                )}
              >
                Reset
              </button>
              <button
                onClick={() => setOnLossAction("increase")}
                className={cn(
                  "flex-1 py-2 rounded-lg text-xs font-medium transition-all",
                  onLossAction === "increase" ? "bg-[#E04890]/10 text-[#E04890]" : "bg-[#211E21] text-[#9DA6A3]",
                )}
              >
                Increase
              </button>
            </div>
            {onLossAction === "increase" && (
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="number"
                  value={lossIncrease}
                  onChange={(e) => setLossIncrease(Number(e.target.value))}
                  className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#38F868]"
                />
                <span className="text-[#778184] text-sm">%</span>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#778184]">Stop on Profit</span>
              <button
                onClick={() => setStopOnProfit(!stopOnProfit)}
                className={cn(
                  "w-10 h-5 rounded-full transition-all relative",
                  stopOnProfit ? "bg-[#38F868]" : "bg-[#423941]",
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all",
                    stopOnProfit ? "left-5" : "left-0.5",
                  )}
                />
              </button>
            </div>
            {stopOnProfit && (
              <input
                type="number"
                value={profitLimit}
                onChange={(e) => setProfitLimit(Number(e.target.value))}
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#38F868]"
                placeholder="Profit limit"
              />
            )}

            <div className="flex items-center justify-between">
              <span className="text-xs text-[#778184]">Stop on Loss</span>
              <button
                onClick={() => setStopOnLoss(!stopOnLoss)}
                className={cn(
                  "w-10 h-5 rounded-full transition-all relative",
                  stopOnLoss ? "bg-[#E04890]" : "bg-[#423941]",
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all",
                    stopOnLoss ? "left-5" : "left-0.5",
                  )}
                />
              </button>
            </div>
            {stopOnLoss && (
              <input
                type="number"
                value={lossLimit}
                onChange={(e) => setLossLimit(Number(e.target.value))}
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#38F868]"
                placeholder="Loss limit"
              />
            )}
          </div>

          {isAutoRunning ? (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-[#38F868]/10">
                <span className="w-2 h-2 rounded-full bg-[#38F868] animate-pulse" />
                <span className="text-xs text-[#38F868] font-medium">Autobet running...</span>
              </div>
              <button
                onClick={() => setIsAutoRunning(false)}
                className="w-full py-3 rounded-xl text-sm font-bold bg-[#E04890] text-white hover:bg-[#E04890]/90 transition-all"
              >
                STOP AUTOBET
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAutoRunning(true)}
              disabled={isInvalidBet}
              className={cn(
                "w-full py-4 rounded-xl text-base font-bold transition-all",
                isInvalidBet
                  ? "bg-[#423941] text-[#778184] cursor-not-allowed"
                  : "bg-[#38F868] text-black hover:bg-[#40F870] hover:shadow-[0_0_30px_rgba(56,248,104,0.4)]",
              )}
            >
              START AUTOBET
            </button>
          )}
        </div>
      )}
    </div>
  )
}
