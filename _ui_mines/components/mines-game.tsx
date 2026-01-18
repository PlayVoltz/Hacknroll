"use client"

import { useState, useEffect, useCallback } from "react"
import { TopBar } from "./top-bar"
import { GameControls } from "./game-controls"
import { MinesGrid } from "./mines-grid"
import { StatsPanel } from "./stats-panel"
import { Confetti } from "./confetti"

export type GameStatus = "READY" | "PLAYING" | "LOST" | "CASHED_OUT"

export type TileState = {
  isMine: boolean
  isRevealed: boolean
}

interface MinesGameProps {
  onBack?: () => void
}

export function MinesGame({ onBack }: MinesGameProps) {
  const [minesCount, setMinesCount] = useState(5)
  const [betAmount, setBetAmount] = useState(10)
  const [gameStatus, setGameStatus] = useState<GameStatus>("READY")
  const [tiles, setTiles] = useState<TileState[]>(Array(25).fill({ isMine: false, isRevealed: false }))
  const [gemsFound, setGemsFound] = useState(0)
  const [multiplier, setMultiplier] = useState(1.0)
  const [showConfetti, setShowConfetti] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    const savedMines = localStorage.getItem("mines-count")
    const savedBet = localStorage.getItem("mines-bet")
    if (savedMines) setMinesCount(Number.parseInt(savedMines))
    if (savedBet) setBetAmount(Number.parseFloat(savedBet))
  }, [])

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem("mines-count", minesCount.toString())
  }, [minesCount])

  useEffect(() => {
    localStorage.setItem("mines-bet", betAmount.toString())
  }, [betAmount])

  const startGame = useCallback(() => {
    // Generate mine positions
    const minePositions = new Set<number>()
    while (minePositions.size < minesCount) {
      minePositions.add(Math.floor(Math.random() * 25))
    }

    const newTiles = Array(25)
      .fill(null)
      .map((_, i) => ({
        isMine: minePositions.has(i),
        isRevealed: false,
      }))

    setTiles(newTiles)
    setGemsFound(0)
    setMultiplier(1.0)
    setGameStatus("PLAYING")
    setShowConfetti(false)
  }, [minesCount])

  const revealTile = useCallback(
    (index: number) => {
      if (gameStatus !== "PLAYING") return
      if (tiles[index].isRevealed) return

      const newTiles = [...tiles]
      newTiles[index] = { ...newTiles[index], isRevealed: true }
      setTiles(newTiles)

      if (tiles[index].isMine) {
        // Reveal all mines
        const revealedTiles = newTiles.map((tile) => ({
          ...tile,
          isRevealed: tile.isMine ? true : tile.isRevealed,
        }))
        setTiles(revealedTiles)
        setGameStatus("LOST")
      } else {
        // Safe tile
        const newGemsFound = gemsFound + 1
        setGemsFound(newGemsFound)
        // Multiplier formula: multiplier *= 1 + minesCount / 60
        const newMultiplier = multiplier * (1 + minesCount / 60)
        setMultiplier(newMultiplier)

        // Check if all safe tiles are revealed
        const safeTilesCount = 25 - minesCount
        if (newGemsFound >= safeTilesCount) {
          setShowConfetti(true)
          setGameStatus("CASHED_OUT")
        }
      }
    },
    [gameStatus, tiles, gemsFound, multiplier, minesCount],
  )

  const cashOut = useCallback(() => {
    if (gameStatus !== "PLAYING" || gemsFound === 0) return
    setShowConfetti(true)
    setGameStatus("CASHED_OUT")
  }, [gameStatus, gemsFound])

  const resetGame = useCallback(() => {
    setTiles(Array(25).fill({ isMine: false, isRevealed: false }))
    setGemsFound(0)
    setMultiplier(1.0)
    setGameStatus("READY")
    setShowConfetti(false)
  }, [])

  const tilesLeft = 25 - minesCount - gemsFound

  return (
    <div className="min-h-screen bg-surface-deep p-4 md:p-6">
      {showConfetti && <Confetti />}
      <div className="mx-auto max-w-5xl">
        <TopBar gameStatus={gameStatus} onBack={onBack} />

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Grid Section */}
          <div className="order-2 lg:order-1">
            <MinesGrid
              tiles={tiles}
              gameStatus={gameStatus}
              onReveal={revealTile}
              onCashOut={cashOut}
              gemsFound={gemsFound}
              multiplier={multiplier}
              betAmount={betAmount}
            />
          </div>

          {/* Controls & Stats Section */}
          <div className="order-1 flex flex-col gap-4 lg:order-2">
            <GameControls
              minesCount={minesCount}
              setMinesCount={setMinesCount}
              betAmount={betAmount}
              setBetAmount={setBetAmount}
              gameStatus={gameStatus}
              onStart={startGame}
              onReset={resetGame}
            />

            <StatsPanel
              tilesLeft={tilesLeft}
              gemsFound={gemsFound}
              minesCount={minesCount}
              multiplier={multiplier}
              payout={betAmount * multiplier}
              gameStatus={gameStatus}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
