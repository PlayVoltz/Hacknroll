"use client"

import { useState, useCallback, useRef } from "react"
import { PlinkoBoard, type Ball } from "@/components/plinko-board"
import { Minus, Plus } from "lucide-react"

export type Risk = "low" | "medium" | "high"

type Result = {
  id: number
  multiplier: number
}

export default function PlinkoGame() {
  const [balance, setBalance] = useState(1000)
  const [betAmount, setBetAmount] = useState(10)
  const [risk, setRisk] = useState<Risk>("medium")
  const [rows, setRows] = useState(12)
  const [balls, setBalls] = useState<Ball[]>([])
  const [recentResults, setRecentResults] = useState<Result[]>([])
  const ballIdRef = useRef(0)
  const resultIdRef = useRef(0)

  const getMultipliers = useCallback((rowCount: number, riskLevel: Risk) => {
    const baseMultipliers: Record<number, Record<Risk, number[]>> = {
      8: {
        low: [5, 2, 1.5, 1, 0.5, 1, 1.5, 2, 5],
        medium: [10, 5, 2, 1, 0.5, 1, 2, 5, 10],
        high: [25, 10, 5, 2, 0, 2, 5, 10, 25],
      },
      10: {
        low: [8, 4, 2, 1.5, 1, 0.5, 1, 1.5, 2, 4, 8],
        medium: [15, 8, 4, 2, 1, 0.5, 1, 2, 4, 8, 15],
        high: [50, 15, 8, 4, 2, 0, 2, 4, 8, 15, 50],
      },
      12: {
        low: [10, 5, 3, 2, 1.5, 1, 0.5, 1, 1.5, 2, 3, 5, 10],
        medium: [25, 10, 5, 3, 2, 1, 0.5, 1, 2, 3, 5, 10, 25],
        high: [100, 25, 10, 5, 3, 1, 0, 1, 3, 5, 10, 25, 100],
      },
      14: {
        low: [15, 8, 5, 3, 2, 1.5, 1, 0.5, 1, 1.5, 2, 3, 5, 8, 15],
        medium: [50, 15, 8, 5, 3, 2, 1, 0.5, 1, 2, 3, 5, 8, 15, 50],
        high: [200, 50, 15, 8, 5, 3, 1, 0, 1, 3, 5, 8, 15, 50, 200],
      },
      16: {
        low: [20, 10, 8, 5, 3, 2, 1.5, 1, 0.5, 1, 1.5, 2, 3, 5, 8, 10, 20],
        medium: [100, 25, 15, 8, 5, 3, 2, 1, 0.5, 1, 2, 3, 5, 8, 15, 25, 100],
        high: [500, 100, 25, 15, 8, 5, 3, 1, 0, 1, 3, 5, 8, 15, 25, 100, 500],
      },
    }
    return baseMultipliers[rowCount]?.[riskLevel] || baseMultipliers[12][riskLevel]
  }, [])

  const multipliers = getMultipliers(rows, risk)

  const handleDrop = useCallback(() => {
    if (betAmount > balance) return

    setBalance((prev) => prev - betAmount)

    const scale = 2
    const pegSpacingX = 36 * scale
    const boardWidth = Math.max((rows + 8) * pegSpacingX, (rows + 5) * pegSpacingX)
    const startX = boardWidth / 2

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
      betAmount,
    }

    setBalls((prev) => [...prev, newBall])
  }, [betAmount, balance, rows])

  const handleBallFinish = useCallback(
    (ballId: number, slotIndex: number, ballBetAmount: number) => {
      const multiplier = multipliers[slotIndex]
      const payout = ballBetAmount * multiplier

      setBalance((prev) => prev + payout)
      setRecentResults((prev) => [{ id: resultIdRef.current++, multiplier }, ...prev.slice(0, 9)])

      setTimeout(() => {
        setBalls((prev) => prev.filter((b) => b.id !== ballId))
      }, 300)
    },
    [multipliers],
  )

  const handleBetChange = (delta: number) => {
    const newAmount = Math.max(1, Math.min(balance, betAmount + delta))
    setBetAmount(newAmount)
  }

  const rowOptions = [8, 10, 12, 14, 16]
  const riskOptions: Risk[] = ["low", "medium", "high"]

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-white/10">
        <h1 className="text-xl font-bold">
          <span className="text-[#38F868]">Plinko</span>
        </h1>
        <div className="text-[#38F868] font-bold">${balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
      </header>

      {/* Controls */}
      <div className="p-4 border-b border-white/10 space-y-3">
        {/* Bet Amount */}
        <div className="flex items-center justify-center gap-4">
          <span className="text-sm text-gray-400 w-12">Bet</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBetChange(-10)}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              aria-label="Decrease bet"
            >
              <Minus className="w-4 h-4" />
            </button>
            <input
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(Math.max(1, Math.min(balance, Number(e.target.value))))}
              className="w-20 bg-white/10 rounded-lg px-3 py-2 text-center font-medium"
              min={1}
              max={balance}
            />
            <button
              onClick={() => handleBetChange(10)}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              aria-label="Increase bet"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Risk and Rows */}
        <div className="flex items-center justify-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Risk</span>
            <div className="flex gap-1">
              {riskOptions.map((r) => (
                <button
                  key={r}
                  onClick={() => setRisk(r)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    risk === r ? "bg-[#38F868] text-black" : "bg-white/10 text-gray-400 hover:text-white"
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
                    rows === r ? "bg-[#38F868] text-black" : "bg-white/10 text-gray-400 hover:text-white"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Drop Button */}
        <button
          onClick={handleDrop}
          disabled={betAmount > balance}
          className="w-full py-3 bg-[#38F868] text-black font-bold rounded-xl hover:bg-[#2dd655] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Drop Ball
        </button>
      </div>

      {/* Plinko Board */}
      <div className="flex-1 p-4 min-h-0 overflow-hidden">
        <PlinkoBoard
          rows={rows}
          multipliers={multipliers}
          balls={balls}
          onBallFinish={handleBallFinish}
          onBallsChange={setBalls}
        />
      </div>

      <div className="p-4 border-t border-white/10">
        <p className="text-sm text-gray-400 mb-2">Recent Results</p>
        <div className="flex gap-2 flex-wrap min-h-[32px]">
          {recentResults.length === 0 ? (
            <span className="text-sm text-gray-500">No results yet</span>
          ) : (
            recentResults.map((result) => (
              <span
                key={result.id}
                className={`px-3 py-1 rounded-lg text-sm font-bold ${
                  result.multiplier >= 10
                    ? "bg-[#38F868] text-black"
                    : result.multiplier >= 2
                      ? "bg-[#38F868]/50 text-white"
                      : "bg-white/10 text-gray-300"
                }`}
              >
                {result.multiplier}x
              </span>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
