"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Volume2, VolumeX, ChevronDown, RotateCw, CheckCircle } from "lucide-react"
import { Coin } from "./coin"

interface GameResult {
  side: "heads" | "tails"
  won: boolean
  net: number
  timestamp: Date
}

interface GameStageProps {
  isFlipping: boolean
  result: "heads" | "tails" | null
  hasWon: boolean | null
  winAmount: number
  betAmount: number
  streakMultiplier: number
  history: GameResult[]
}

export function GameStage({
  isFlipping,
  result,
  hasWon,
  winAmount,
  betAmount,
  streakMultiplier,
  history,
}: GameStageProps) {
  const [soundEnabled, setSoundEnabled] = useState(false)
  const [fairnessOpen, setFairnessOpen] = useState(false)
  const [clientSeed, setClientSeed] = useState("a1b2c3d4e5f6")

  const showResult = !isFlipping && result !== null

  return (
    <div
      className="flex-1 rounded-[20px] p-5 lg:p-6"
      style={{
        background: "linear-gradient(180deg, #211E21 0%, #423941 100%)",
      }}
    >
      {/* Top Stats Row */}
      <div className="flex items-center justify-between mb-6">
        <span className="text-xs text-[#778184]">
          Win chance <span className="text-white font-medium">50%</span>
        </span>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#778184]">Multiplier</span>
          <span className="text-sm font-bold text-[#38F868]">×{streakMultiplier.toFixed(2)}</span>
        </div>

        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="p-2 rounded-lg hover:bg-[#0C0F11]/50 transition-colors"
        >
          {soundEnabled ? (
            <Volume2 className="w-4 h-4 text-[#9DA6A3]" />
          ) : (
            <VolumeX className="w-4 h-4 text-[#778184]" />
          )}
        </button>
      </div>

      {/* Coin Animation Area */}
      <div className="relative h-64 flex items-center justify-center">
        <Coin
          isFlipping={isFlipping}
          result={result}
          showWin={showResult && hasWon === true}
          showLoss={showResult && hasWon === false}
        />

        {/* Result Overlay */}
        {showResult && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="result-overlay text-center mt-48">
              <div className={cn("text-3xl font-black tracking-wider", hasWon ? "text-[#38F868]" : "text-[#E04890]")}>
                {result?.toUpperCase()}
              </div>
              <div className={cn("text-lg font-bold mt-1", hasWon ? "text-[#38F868]" : "text-[#E04890]")}>
                {hasWon ? `+${winAmount.toLocaleString()}` : `-${betAmount.toLocaleString()}`} credits
              </div>
            </div>
          </div>
        )}
      </div>

      {/* History Strip */}
      <div className="mt-6">
        <span className="text-xs text-[#778184] mb-2 block">Recent Results</span>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {history.slice(-12).map((item, idx) => (
            <div
              key={idx}
              className={cn(
                "flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold border-2 transition-all cursor-default",
                item.side === "heads"
                  ? "border-[#F8C840]/50 text-[#F8C840] bg-[#F8C840]/10"
                  : "border-[#48B0E8]/50 text-[#48B0E8] bg-[#48B0E8]/10",
              )}
              title={`${item.side.toUpperCase()} • ${item.won ? "+" : ""}${item.net} • ${item.timestamp.toLocaleTimeString()}`}
            >
              {item.side === "heads" ? "H" : "T"}
            </div>
          ))}
          {history.length === 0 && <span className="text-xs text-[#778184] italic">No results yet</span>}
        </div>
      </div>

      {/* Fairness Accordion */}
      <div className="mt-6 border border-[#2a2a2a] rounded-xl overflow-hidden">
        <button
          onClick={() => setFairnessOpen(!fairnessOpen)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#0C0F11]/30 transition-colors"
        >
          <span className="text-sm font-medium text-white">Fairness</span>
          <ChevronDown className={cn("w-4 h-4 text-[#9DA6A3] transition-transform", fairnessOpen && "rotate-180")} />
        </button>

        {fairnessOpen && (
          <div className="p-4 pt-0 space-y-4 border-t border-[#2a2a2a]">
            <div>
              <label className="text-xs text-[#778184] mb-1.5 block">Client Seed</label>
              <input
                type="text"
                value={clientSeed}
                onChange={(e) => setClientSeed(e.target.value)}
                className="w-full bg-[#0C0F11] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#38F868] focus:ring-1 focus:ring-[#38F868]/50"
              />
            </div>

            <div>
              <label className="text-xs text-[#778184] mb-1.5 block">Server Seed Hash</label>
              <input
                type="text"
                value="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
                readOnly
                className="w-full bg-[#0C0F11] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-[#778184] font-mono text-xs"
              />
            </div>

            <div>
              <label className="text-xs text-[#778184] mb-1.5 block">Nonce</label>
              <input
                type="text"
                value={history.length.toString()}
                readOnly
                className="w-full bg-[#0C0F11] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-[#778184]"
              />
            </div>

            <div className="flex gap-2">
              <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-[#211E21] text-xs font-medium text-[#9DA6A3] hover:bg-[#423941] hover:text-white transition-all">
                <RotateCw className="w-3.5 h-3.5" />
                Rotate Seed
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-[#211E21] text-xs font-medium text-[#9DA6A3] hover:bg-[#423941] hover:text-white transition-all">
                <CheckCircle className="w-3.5 h-3.5" />
                Verify
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
