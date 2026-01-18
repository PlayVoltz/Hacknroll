"use client"

import { useEffect, useState } from "react"
import { Sparkles } from "lucide-react"

interface Particle {
  id: number
  x: number
  y: number
  color: string
  delay: number
}

export function Confetti() {
  const [particles, setParticles] = useState<Particle[]>([])

  useEffect(() => {
    const colors = ["#38F868", "#48B0E8", "#F8C840", "#E04890", "#B81098"]
    const newParticles: Particle[] = []

    for (let i = 0; i < 20; i++) {
      newParticles.push({
        id: i,
        x: 30 + Math.random() * 40, // Center area (30-70% of width)
        y: 20 + Math.random() * 30, // Top area (20-50% of height)
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 0.3,
      })
    }

    setParticles(newParticles)

    // Clean up after animation
    const timer = setTimeout(() => {
      setParticles([])
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute animate-float-up"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            animationDelay: `${particle.delay}s`,
            color: particle.color,
          }}
        >
          <Sparkles className="h-6 w-6" style={{ color: particle.color }} />
        </div>
      ))}
    </div>
  )
}
