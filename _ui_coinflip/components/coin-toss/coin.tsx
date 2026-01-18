"use client"

import { cn } from "@/lib/utils"

interface CoinProps {
  isFlipping: boolean
  result: "heads" | "tails" | null
  showWin: boolean
  showLoss: boolean
}

export function Coin({ isFlipping, result, showWin, showLoss }: CoinProps) {
  return (
    <div className="relative w-40 h-40 mx-auto" style={{ perspective: "1000px" }}>
      <div
        className={cn(
          "w-full h-full relative transition-transform duration-200",
          isFlipping && (result === "heads" ? "coin-flip-heads" : "coin-flip-tails"),
          showWin && "win-glow rounded-full",
          showLoss && "loss-glow rounded-full",
        )}
        style={{
          transformStyle: "preserve-3d",
          transform: !isFlipping && result === "tails" ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* Heads side */}
        <div
          className="absolute inset-0 rounded-full flex items-center justify-center"
          style={{
            backfaceVisibility: "hidden",
            background: "linear-gradient(145deg, #F8C840 0%, #D4A830 50%, #B08828 100%)",
            boxShadow:
              "inset 0 4px 20px rgba(255,255,255,0.3), inset 0 -4px 20px rgba(0,0,0,0.3), 0 8px 32px rgba(0,0,0,0.5)",
          }}
        >
          <div className="text-center">
            <div className="text-4xl font-black text-[#5a3d10] drop-shadow-lg">H</div>
            <div className="text-xs font-bold text-[#5a3d10]/80 tracking-widest mt-1">HEADS</div>
          </div>
          <div
            className="absolute inset-2 rounded-full border-4 border-[#B08828]/40"
            style={{ boxShadow: "inset 0 0 10px rgba(0,0,0,0.2)" }}
          />
        </div>

        {/* Tails side */}
        <div
          className="absolute inset-0 rounded-full flex items-center justify-center"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            background: "linear-gradient(145deg, #48B0E8 0%, #3090C8 50%, #2070A8 100%)",
            boxShadow:
              "inset 0 4px 20px rgba(255,255,255,0.3), inset 0 -4px 20px rgba(0,0,0,0.3), 0 8px 32px rgba(0,0,0,0.5)",
          }}
        >
          <div className="text-center">
            <div className="text-4xl font-black text-[#103050] drop-shadow-lg">T</div>
            <div className="text-xs font-bold text-[#103050]/80 tracking-widest mt-1">TAILS</div>
          </div>
          <div
            className="absolute inset-2 rounded-full border-4 border-[#2070A8]/40"
            style={{ boxShadow: "inset 0 0 10px rgba(0,0,0,0.2)" }}
          />
        </div>
      </div>
    </div>
  )
}
