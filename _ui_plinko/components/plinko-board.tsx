"use client"

import { useEffect, useRef, useCallback } from "react"

interface Ball {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  path: number[]
  currentRow: number
  finished: boolean
  finalSlot: number | null
  betAmount: number
}

interface PlinkoBoardProps {
  rows: number
  multipliers: number[]
  balls: Ball[]
  onBallFinish: (ballId: number, slotIndex: number, betAmount: number) => void
  onBallsChange: (balls: Ball[]) => void
}

export function PlinkoBoard({ rows, multipliers, balls, onBallFinish, onBallsChange }: PlinkoBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | null>(null)
  const ballsRef = useRef<Ball[]>([])
  const finishedBallsRef = useRef<Set<number>>(new Set())
  const glowingSlotsRef = useRef<Map<number, number>>(new Map())

  const scale = 2
  const pegRadius = 5 * scale
  const ballRadius = 8 * scale
  const gravity = 0.18 * scale
  const friction = 0.98
  const bounciness = 0.6
  const pegSpacingX = 36 * scale
  const pegSpacingY = 32 * scale

  const numSlots = rows + 1
  const slotsWidth = (numSlots + 4) * pegSpacingX
  const boardWidth = Math.max((rows + 8) * pegSpacingX, slotsWidth + 60 * scale)
  const boardHeight = rows * pegSpacingY + 180 * scale
  const startX = boardWidth / 2
  const startY = 25 * scale

  useEffect(() => {
    const existingIds = new Set(ballsRef.current.map((b) => b.id))
    const newBalls = balls.filter((b) => !existingIds.has(b.id))

    const incomingIds = new Set(balls.map((b) => b.id))
    const keptBalls = ballsRef.current.filter((b) => incomingIds.has(b.id))

    ballsRef.current = [...keptBalls, ...newBalls]
  }, [balls])

  const getPegPositions = useCallback(() => {
    const positions: { x: number; y: number }[] = []
    for (let row = 0; row < rows; row++) {
      const pegsInRow = row + 3
      const rowWidth = (pegsInRow - 1) * pegSpacingX
      const rowStartX = startX - rowWidth / 2

      for (let col = 0; col < pegsInRow; col++) {
        positions.push({
          x: rowStartX + col * pegSpacingX,
          y: startY + 40 * scale + row * pegSpacingY,
        })
      }
    }
    return positions
  }, [rows, startX, pegSpacingX, pegSpacingY, scale])

  const getSlotPositions = useCallback(() => {
    const slotWidth = pegSpacingX - 4 * scale
    const slotGap = 4 * scale
    const totalSlotsWidth = numSlots * slotWidth + (numSlots - 1) * slotGap
    const slotsStartX = startX - totalSlotsWidth / 2 + slotWidth / 2
    const slotY = startY + 40 * scale + rows * pegSpacingY + 25 * scale

    return multipliers.map((_, index) => ({
      x: slotsStartX + index * (slotWidth + slotGap),
      y: slotY,
      width: slotWidth,
    }))
  }, [rows, multipliers, startX, numSlots, pegSpacingX, scale])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = "high"

    const pegs = getPegPositions()
    const slots = getSlotPositions()

    const triangleTopX = startX
    const triangleBottomWidth = (rows + 2) * pegSpacingX + pegSpacingX

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      pegs.forEach((peg) => {
        const gradient = ctx.createRadialGradient(
          peg.x - pegRadius * 0.3,
          peg.y - pegRadius * 0.3,
          0,
          peg.x,
          peg.y,
          pegRadius,
        )
        gradient.addColorStop(0, "#6FFF9A")
        gradient.addColorStop(1, "#38F868")

        ctx.beginPath()
        ctx.arc(peg.x, peg.y, pegRadius, 0, Math.PI * 2)
        ctx.fillStyle = gradient
        ctx.shadowColor = "rgba(56, 248, 104, 0.6)"
        ctx.shadowBlur = 8 * scale
        ctx.fill()
        ctx.shadowBlur = 0
      })

      const slotWidth = pegSpacingX - 4 * scale
      const slotHeight = 40 * scale
      const slotRadius = 6 * scale

      slots.forEach((slot, index) => {
        const glowIntensity = glowingSlotsRef.current.get(index) || 0

        if (glowIntensity > 0) {
          ctx.shadowColor = `rgba(56, 248, 104, ${glowIntensity})`
          ctx.shadowBlur = 20 * scale
        }

        const slotGradient = ctx.createLinearGradient(
          slot.x - slotWidth / 2,
          slot.y,
          slot.x + slotWidth / 2,
          slot.y + slotHeight,
        )
        if (glowIntensity > 0) {
          slotGradient.addColorStop(0, "#6FFF9A")
          slotGradient.addColorStop(1, "#38F868")
        } else {
          slotGradient.addColorStop(0, "#38F868")
          slotGradient.addColorStop(1, "#2AD050")
        }

        ctx.fillStyle = slotGradient
        ctx.beginPath()
        ctx.roundRect(slot.x - slotWidth / 2, slot.y, slotWidth, slotHeight, slotRadius)
        ctx.fill()
        ctx.shadowBlur = 0

        ctx.strokeStyle = "rgba(111, 255, 154, 0.5)"
        ctx.lineWidth = 1 * scale
        ctx.stroke()

        ctx.fillStyle = "#000000"
        ctx.font = `bold ${14 * scale}px sans-serif`
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText(`${multipliers[index]}x`, slot.x, slot.y + slotHeight / 2)
      })

      ballsRef.current.forEach((ball) => {
        if (!ball.finished) {
          const ballGradient = ctx.createRadialGradient(
            ball.x - ballRadius * 0.3,
            ball.y - ballRadius * 0.3,
            0,
            ball.x,
            ball.y,
            ballRadius,
          )
          ballGradient.addColorStop(0, "#ffffff")
          ballGradient.addColorStop(0.7, "#f0f0f0")
          ballGradient.addColorStop(1, "#d0d0d0")

          ctx.beginPath()
          ctx.arc(ball.x, ball.y, ballRadius, 0, Math.PI * 2)
          ctx.fillStyle = ballGradient
          ctx.shadowColor = "rgba(255, 255, 255, 0.8)"
          ctx.shadowBlur = 15 * scale
          ctx.fill()
          ctx.shadowBlur = 0

          ctx.strokeStyle = "rgba(255, 255, 255, 0.5)"
          ctx.lineWidth = 1 * scale
          ctx.stroke()
        }
      })

      ctx.beginPath()
      ctx.arc(startX, startY, 6 * scale, 0, Math.PI * 2)
      ctx.strokeStyle = "rgba(56, 248, 104, 0.5)"
      ctx.lineWidth = 2 * scale
      ctx.stroke()

      glowingSlotsRef.current.forEach((intensity, slotIndex) => {
        const newIntensity = intensity - 0.02
        if (newIntensity <= 0) {
          glowingSlotsRef.current.delete(slotIndex)
        } else {
          glowingSlotsRef.current.set(slotIndex, newIntensity)
        }
      })
    }

    const updatePhysics = () => {
      const currentBalls = ballsRef.current
      if (currentBalls.length === 0) return

      for (let i = 0; i < currentBalls.length; i++) {
        const ball = currentBalls[i]
        if (ball.finished) continue

        ball.vy += gravity
        ball.vx *= friction
        ball.x += ball.vx
        ball.y += ball.vy

        for (const peg of pegs) {
          const dx = ball.x - peg.x
          const dy = ball.y - peg.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          const minDist = pegRadius + ballRadius

          if (dist < minDist && dist > 0) {
            const nx = dx / dist
            const ny = dy / dist

            ball.x = peg.x + nx * minDist
            ball.y = peg.y + ny * minDist

            const relVel = ball.vx * nx + ball.vy * ny

            if (relVel < 0) {
              ball.vx -= (1 + bounciness) * relVel * nx
              ball.vy -= (1 + bounciness) * relVel * ny

              const randomBounce = (Math.random() > 0.5 ? 1 : -1) * (0.5 + Math.random() * 0.8)
              ball.vx += randomBounce
            }
          }
        }

        const progress = (ball.y - startY) / (rows * pegSpacingY)
        const currentTriangleWidth = progress * triangleBottomWidth
        const leftBound = triangleTopX - currentTriangleWidth / 2 - ballRadius * 2
        const rightBound = triangleTopX + currentTriangleWidth / 2 + ballRadius * 2

        if (ball.x < leftBound) {
          ball.x = leftBound
          ball.vx = Math.abs(ball.vx) * bounciness
        }
        if (ball.x > rightBound) {
          ball.x = rightBound
          ball.vx = -Math.abs(ball.vx) * bounciness
        }

        const slotY = startY + 40 * scale + rows * pegSpacingY + 25 * scale
        if (ball.y >= slotY && !finishedBallsRef.current.has(ball.id)) {
          const slotWidth = pegSpacingX - 4 * scale
          const slotGap = 4 * scale
          const totalSlotsWidth = numSlots * slotWidth + (numSlots - 1) * slotGap
          const slotsStartX = startX - totalSlotsWidth / 2 + slotWidth / 2

          let slotIndex = Math.round((ball.x - slotsStartX) / (slotWidth + slotGap))
          slotIndex = Math.max(0, Math.min(numSlots - 1, slotIndex))

          ball.finished = true
          ball.finalSlot = slotIndex
          finishedBallsRef.current.add(ball.id)

          glowingSlotsRef.current.set(slotIndex, 1)

          onBallFinish(ball.id, slotIndex, ball.betAmount)
        }
      }
    }

    const gameLoop = () => {
      updatePhysics()
      render()
      animationRef.current = requestAnimationFrame(gameLoop)
    }

    animationRef.current = requestAnimationFrame(gameLoop)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [
    rows,
    multipliers,
    getPegPositions,
    getSlotPositions,
    onBallFinish,
    startX,
    numSlots,
    scale,
    pegSpacingX,
    pegSpacingY,
    pegRadius,
    ballRadius,
    gravity,
  ])

  return (
    <div className="w-full h-full flex items-center justify-center">
      <canvas
        ref={canvasRef}
        width={boardWidth}
        height={boardHeight}
        style={{
          width: boardWidth / scale,
          height: boardHeight / scale,
          maxWidth: "100%",
          maxHeight: "100%",
        }}
      />
    </div>
  )
}

export type { Ball }
