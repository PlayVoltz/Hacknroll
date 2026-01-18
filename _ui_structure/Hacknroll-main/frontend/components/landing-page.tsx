"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import AuthModal from "./auth-modal"
import { Sparkles, Users, Trophy, Zap, Shield, Gamepad2 } from "lucide-react"

export default function LandingPage() {
  const [showAuthModal, setShowAuthModal] = useState(false)

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-lime/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-magenta/10 rounded-full blur-[120px] animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-cyan/10 rounded-full blur-[100px] animate-pulse delay-500" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 lg:px-12">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-neon-lime flex items-center justify-center">
            <Gamepad2 className="w-6 h-6 text-background" />
          </div>
          <span className="text-2xl font-bold text-foreground">DarePot</span>
        </div>
        <Button
          onClick={() => setShowAuthModal(true)}
          className="bg-neon-lime text-background hover:bg-neon-lime-glow font-semibold px-6 neon-glow-hover transition-all"
        >
          Play Now
        </Button>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center px-6 pt-16 pb-24 lg:pt-24">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-elevated border border-border mb-6">
            <Sparkles className="w-4 h-4 text-neon-lime" />
            <span className="text-sm text-muted-foreground">Virtual credits only. No real money.</span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-foreground mb-6 leading-tight text-balance">
            Play the Season. <span className="text-gradient">Someone&apos;s Doing the Dare.</span>
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto text-pretty">
            Create a friend group. Compete in seasons. The loser does the dare. It&apos;s like fantasy sports, but for
            degenerates who love accountability.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => setShowAuthModal(true)}
              size="lg"
              className="bg-neon-lime text-background hover:bg-neon-lime-glow font-bold text-lg px-8 py-6 neon-glow transition-all"
            >
              Start Playing Free
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-border text-foreground hover:bg-surface-elevated font-semibold text-lg px-8 py-6 bg-transparent"
            >
              Watch Demo
            </Button>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 max-w-5xl mx-auto w-full">
          <FeatureCard
            icon={<Users className="w-6 h-6" />}
            title="Squad Up"
            description="Create unlimited friend groups. Each group runs its own seasons and leaderboards."
            color="neon-lime"
          />
          <FeatureCard
            icon={<Trophy className="w-6 h-6" />}
            title="Compete & Dare"
            description="Lowest balance at season end does the dare. Choose from our unhinged dare library."
            color="magenta"
          />
          <FeatureCard
            icon={<Zap className="w-6 h-6" />}
            title="Casino Vibes"
            description="Poker, Blackjack, Crash, Mines, and more. All the games, none of the real money risk."
            color="cyan"
          />
        </div>

        {/* Game Preview Grid */}
        <div className="mt-24 w-full max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-foreground text-center mb-8">Games That Hit Different</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {["Poker", "Blackjack", "Crash", "Mines", "Plinko", "Roulette", "Wheel", "Tower"].map((game, i) => (
              <div
                key={game}
                className="aspect-video rounded-2xl bg-surface border border-border overflow-hidden group cursor-pointer hover:border-neon-lime/50 transition-all neon-glow-hover"
              >
                <div className="w-full h-full bg-gradient-to-br from-surface-elevated to-surface flex items-center justify-center">
                  <span className="text-lg font-semibold text-foreground group-hover:text-neon-lime transition-colors">
                    {game}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 18+ Disclaimer */}
        <div className="mt-24 flex items-center gap-3 px-6 py-4 rounded-xl bg-surface-elevated border border-border">
          <Shield className="w-5 h-5 text-yellow" />
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">18+ Only.</strong> Virtual credits for entertainment purposes only. No
            real money gambling. Play responsibly with friends.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-neon-lime flex items-center justify-center">
              <Gamepad2 className="w-4 h-4 text-background" />
            </div>
            <span className="font-bold text-foreground">DarePot</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 DarePot. Virtual credits only. No real money involved.</p>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal open={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
  color,
}: {
  icon: React.ReactNode
  title: string
  description: string
  color: "neon-lime" | "magenta" | "cyan"
}) {
  const colorClasses = {
    "neon-lime": "text-neon-lime bg-neon-lime/10",
    magenta: "text-magenta bg-magenta/10",
    cyan: "text-cyan bg-cyan/10",
  }

  return (
    <div className="p-6 rounded-2xl bg-surface border border-border hover:border-border/80 transition-all group">
      <div className={`w-12 h-12 rounded-xl ${colorClasses[color]} flex items-center justify-center mb-4`}>{icon}</div>
      <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  )
}
