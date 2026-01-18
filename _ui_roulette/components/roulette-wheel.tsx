"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

// Authentic wheel order starting from 0 and going clockwise
const WHEEL_NUMBERS = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7,
  28, 12, 35, 3, 26,
]

const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]

const getSegmentColor = (num: number): "red" | "black" | "green" => {
  if (num === 0) return "green"
  return RED_NUMBERS.includes(num) ? "red" : "black"
}

const SEGMENTS: Array<{ number: number; color: "red" | "black" | "green" }> = WHEEL_NUMBERS.map((num) => ({
  number: num,
  color: getSegmentColor(num),
}))

const SEGMENT_COUNT = 37
const SEGMENT_ANGLE = 360 / SEGMENT_COUNT

const COLORS = {
  red: "#dc2626",
  black: "#1a1a1a",
  green: "#16a34a",
}

interface RouletteWheelProps {
  isSpinning: boolean
  targetIndex: number | null
  onSpinComplete: () => void
  result: { color: "red" | "black" | "green"; index: number } | null
}

export function RouletteWheel({ isSpinning, targetIndex, onSpinComplete, result }: RouletteWheelProps) {
  const [rotation, setRotation] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const wheelRef = useRef<SVGGElement>(null)

  useEffect(() => {
    if (isSpinning && targetIndex !== null) {
      setIsAnimating(true)

      const baseSpins = 6 + Math.random() * 4
      const targetCenterAngle = targetIndex * SEGMENT_ANGLE + SEGMENT_ANGLE / 2
      const randomOffset = (Math.random() - 0.5) * 4
      const finalRotation = baseSpins * 360 + (360 - targetCenterAngle) + randomOffset

      setRotation((prev) => prev + finalRotation)

      const duration = 5000 + Math.random() * 1000

      setTimeout(() => {
        setIsAnimating(false)
        onSpinComplete()
      }, duration)
    }
  }, [isSpinning, targetIndex, onSpinComplete])

  const renderSegments = () => {
    const segments = []
    const radius = 140
    const centerX = 160
    const centerY = 160

    for (let i = 0; i < SEGMENT_COUNT; i++) {
      const startAngle = (i * SEGMENT_ANGLE - 90) * (Math.PI / 180)
      const endAngle = ((i + 1) * SEGMENT_ANGLE - 90) * (Math.PI / 180)

      const x1 = centerX + radius * Math.cos(startAngle)
      const y1 = centerY + radius * Math.sin(startAngle)
      const x2 = centerX + radius * Math.cos(endAngle)
      const y2 = centerY + radius * Math.sin(endAngle)

      const largeArcFlag = SEGMENT_ANGLE > 180 ? 1 : 0

      const pathData = [
        `M ${centerX} ${centerY}`,
        `L ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        "Z",
      ].join(" ")

      const isWinningSegment = result && result.index === i && !isAnimating
      const segmentColor = SEGMENTS[i].color

      segments.push(
        <path
          key={i}
          d={pathData}
          fill={COLORS[segmentColor]}
          stroke="#2a2a2a"
          strokeWidth="1"
          className={cn("transition-all duration-300", isWinningSegment && "brightness-125")}
          style={{
            filter: isWinningSegment ? `drop-shadow(0 0 10px ${COLORS[segmentColor]})` : undefined,
          }}
        />,
      )

      // Add tick marks
      const tickX1 = centerX + (radius - 5) * Math.cos(startAngle)
      const tickY1 = centerY + (radius - 5) * Math.sin(startAngle)
      const tickX2 = centerX + radius * Math.cos(startAngle)
      const tickY2 = centerY + radius * Math.sin(startAngle)

      segments.push(
        <line key={`tick-${i}`} x1={tickX1} y1={tickY1} x2={tickX2} y2={tickY2} stroke="#444" strokeWidth="1" />,
      )
    }

    return segments
  }

  return (
    <div className="relative flex items-center justify-center" role="img" aria-label="Roulette wheel">
      {/* Outer glow ring */}
      <div className="absolute w-[340px] h-[340px] rounded-full bg-gradient-to-b from-zinc-700 to-zinc-900 shadow-[0_0_30px_rgba(74,222,128,0.2)]" />

      {/* Wheel container */}
      <svg width="320" height="320" viewBox="0 0 320 320" className="relative z-10">
        {/* Outer rim */}
        <circle cx="160" cy="160" r="155" fill="none" stroke="url(#rimGradient)" strokeWidth="8" />

        {/* Rim gradient */}
        <defs>
          <linearGradient id="rimGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#666" />
            <stop offset="50%" stopColor="#888" />
            <stop offset="100%" stopColor="#555" />
          </linearGradient>
          <radialGradient id="hubGradient" cx="50%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#666" />
            <stop offset="100%" stopColor="#222" />
          </radialGradient>
        </defs>

        {/* Spinning wheel group */}
        <g
          ref={wheelRef}
          style={{
            transform: `rotate(${rotation}deg)`,
            transformOrigin: "160px 160px",
            transition: isAnimating ? "transform 5s cubic-bezier(0.1, 0.9, 0.2, 1)" : "none",
          }}
        >
          {renderSegments()}

          {/* Center hub */}
          <circle cx="160" cy="160" r="35" fill="url(#hubGradient)" stroke="#444" strokeWidth="2" />
          <circle cx="160" cy="160" r="20" fill="#333" stroke="#555" strokeWidth="1" />
          <circle cx="160" cy="160" r="8" fill="#222" />
        </g>
      </svg>

      {/* Fixed pointer at 12 o'clock */}
      <div className="absolute top-2 z-20">
        <svg width="24" height="32" viewBox="0 0 24 32">
          <path
            d="M12 32 L0 8 L12 0 L24 8 Z"
            fill="#16a34a"
            stroke="#22c55e"
            strokeWidth="2"
            filter="drop-shadow(0 2px 4px rgba(0,0,0,0.5))"
          />
        </svg>
      </div>
    </div>
  )
}
