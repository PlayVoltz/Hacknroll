"use client"

import type React from "react"

import { useState } from "react"
import { Sidebar } from "./sidebar"
import { TopBar } from "./topbar"

interface AppShellProps {
  children: React.ReactNode
  balance: number
  onBalanceChange: (balance: number) => void
}

export function AppShell({ children, balance, onBalanceChange }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#000000] flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col lg:ml-64">
        <TopBar balance={balance} onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
