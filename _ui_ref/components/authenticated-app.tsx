"use client"

import { useState } from "react"
import Sidebar from "./sidebar"
import TopBar from "./top-bar"
import HomePage from "./pages/home-page"
import GroupsPage from "./pages/groups-page"
import LeaderboardPage from "./pages/leaderboard-page"
import DaresPage from "./pages/dares-page"
import LedgerPage from "./pages/ledger-page"
import DashboardPage from "./pages/dashboard-page"
import SettingsPage from "./pages/settings-page"
import GamePage from "./pages/game-page"

export type PageId = "home" | "groups" | "leaderboard" | "dares" | "ledger" | "dashboard" | "settings" | "game"

export default function AuthenticatedApp() {
  const [currentPage, setCurrentPage] = useState<PageId>("home")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeGameId, setActiveGameId] = useState<string | null>(null)

  const handleOpenGame = (gameId: string) => {
    setActiveGameId(gameId)
    setCurrentPage("game")
  }

  const handleBackFromGame = () => {
    setActiveGameId(null)
    setCurrentPage("home")
  }

  const renderPage = () => {
    switch (currentPage) {
      case "home":
        return <HomePage onOpenGame={handleOpenGame} />
      case "game":
        return <GamePage gameId={activeGameId} onBack={handleBackFromGame} />
      case "groups":
        return <GroupsPage />
      case "leaderboard":
        return <LeaderboardPage />
      case "dares":
        return <DaresPage />
      case "ledger":
        return <LedgerPage />
      case "dashboard":
        return <DashboardPage />
      case "settings":
        return <SettingsPage />
      default:
        return <HomePage onOpenGame={handleOpenGame} />
    }
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <TopBar onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />

        <main className="flex-1 overflow-y-auto overflow-x-hidden">{renderPage()}</main>

        {/* 18+ Footer */}
        <footer className="border-t border-border py-3 px-4 bg-surface">
          <p className="text-xs text-muted text-center">
            18+ Only • Virtual credits for entertainment purposes only • No real money • Play responsibly
          </p>
        </footer>
      </div>
    </div>
  )
}
