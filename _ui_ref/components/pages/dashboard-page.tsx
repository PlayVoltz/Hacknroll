"use client"

import { useApp } from "@/lib/app-context"
import { BarChart3, Target, Award, TrendingUp } from "lucide-react"
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from "recharts"

const radarData = [
  { subject: "Aggressive", value: 75, fullMark: 100 },
  { subject: "Loose", value: 60, fullMark: 100 },
  { subject: "Bravery", value: 85, fullMark: 100 },
  { subject: "Tilt Resist", value: 45, fullMark: 100 },
  { subject: "Cashout", value: 70, fullMark: 100 },
]

const lineData = [
  { day: "Mon", credits: 1000 },
  { day: "Tue", credits: 1150 },
  { day: "Wed", credits: 980 },
  { day: "Thu", credits: 1320 },
  { day: "Fri", credits: 1100 },
  { day: "Sat", credits: 1450 },
  { day: "Sun", credits: 1250 },
]

const gameData = [
  { name: "Blackjack", plays: 45 },
  { name: "Crash", plays: 32 },
  { name: "Mines", plays: 28 },
  { name: "Roulette", plays: 20 },
  { name: "Poker", plays: 15 },
]

const badges = [
  { id: 1, name: "Cashout Artist", description: "Perfect timing on 10 cashouts", icon: "🎯", unlocked: true },
  { id: 2, name: "Table Menace", description: "Won 5 hands in a row", icon: "👹", unlocked: true },
  { id: 3, name: "Vibes Gambler", description: "Played 100 games", icon: "✨", unlocked: true },
  { id: 4, name: "The Calculator", description: "Positive ROI for a season", icon: "🧮", unlocked: false },
  { id: 5, name: "Lucky Charm", description: "Hit max multiplier", icon: "🍀", unlocked: false },
  { id: 6, name: "Iron Will", description: "Never went tilt", icon: "🛡️", unlocked: false },
]

export default function DashboardPage() {
  const { user, activeGroup } = useApp()

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
          <BarChart3 className="w-7 h-7 text-neon-lime" />
          Dashboard
        </h1>
        <p className="text-muted-foreground">Your gambling DNA for {activeGroup?.name || "all groups"}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Radar Chart - Gambler DNA */}
        <div className="p-6 rounded-2xl bg-surface border border-border">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-magenta" />
            <h3 className="text-lg font-bold text-foreground">Gambler DNA</h3>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="#423941" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: "#9DA6A3", fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "#778184" }} />
                <Radar name="Stats" dataKey="value" stroke="#38F868" fill="#38F868" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 text-sm text-muted-foreground text-center">
            Based on {Math.floor(Math.random() * 100 + 50)} games played this season
          </div>
        </div>

        {/* Line Chart - Credits Over Time */}
        <div className="p-6 rounded-2xl bg-surface border border-border">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-cyan" />
            <h3 className="text-lg font-bold text-foreground">Credits Over Time</h3>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#423941" />
                <XAxis dataKey="day" tick={{ fill: "#9DA6A3" }} />
                <YAxis tick={{ fill: "#9DA6A3" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#211E21",
                    border: "1px solid #423941",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#FFFFFF" }}
                />
                <Line type="monotone" dataKey="credits" stroke="#48B0E8" strokeWidth={2} dot={{ fill: "#48B0E8" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart - Game Mix */}
        <div className="p-6 rounded-2xl bg-surface border border-border">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-yellow" />
            <h3 className="text-lg font-bold text-foreground">Game Mix</h3>
          </div>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gameData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#423941" />
                <XAxis type="number" tick={{ fill: "#9DA6A3" }} />
                <YAxis dataKey="name" type="category" tick={{ fill: "#9DA6A3" }} width={80} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#211E21",
                    border: "1px solid #423941",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="plays" fill="#F8C840" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Badges */}
        <div className="p-6 rounded-2xl bg-surface border border-border">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-neon-lime" />
            <h3 className="text-lg font-bold text-foreground">Badges</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {badges.map((badge) => (
              <div
                key={badge.id}
                className={`p-3 rounded-xl border transition-all ${
                  badge.unlocked ? "bg-neon-lime/5 border-neon-lime/20" : "bg-surface-elevated border-border opacity-50"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{badge.icon}</span>
                  <span className="font-semibold text-foreground text-sm">{badge.name}</span>
                </div>
                <p className="text-xs text-muted-foreground">{badge.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
