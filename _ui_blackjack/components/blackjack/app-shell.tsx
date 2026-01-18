"use client"

import type React from "react"

import { useState } from "react"
import {
  Home,
  Gamepad2,
  Trophy,
  Users,
  Settings,
  Wallet,
  ChevronDown,
  Bell,
  Menu,
  X,
  Dice5,
  Target,
  Spade,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface AppShellProps {
  children: React.ReactNode
  balance: number
}

const navItems = [
  { icon: Home, label: "Home", href: "/" },
  { icon: Gamepad2, label: "Originals", href: "/originals", active: true },
  { icon: Trophy, label: "Leaderboard", href: "/leaderboard" },
  { icon: Users, label: "Groups", href: "/groups" },
  { icon: Settings, label: "Settings", href: "/settings" },
]

const gameItems = [
  { icon: Spade, label: "Blackjack", href: "/blackjack", active: true },
  { icon: Dice5, label: "Dice", href: "/dice" },
  { icon: Target, label: "Roulette", href: "/roulette" },
]

export function AppShell({ children, balance }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">DP</span>
            </div>
            <span className="font-bold text-lg text-foreground">DarePot</span>
          </div>
          <Button variant="ghost" size="icon-sm" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Group Switcher */}
        <div className="p-4 border-b border-sidebar-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between bg-sidebar-accent border-sidebar-border">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-cyan/20 flex items-center justify-center">
                    <Users className="h-3 w-3 text-cyan" />
                  </div>
                  <span className="text-sm">High Rollers</span>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem>High Rollers</DropdownMenuItem>
              <DropdownMenuItem>Weekend Warriors</DropdownMenuItem>
              <DropdownMenuItem>Create New Group</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                item.active
                  ? "bg-sidebar-accent text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </a>
          ))}

          <div className="pt-4">
            <p className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Games</p>
            {gameItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                  item.active
                    ? "bg-primary/10 text-primary border border-primary/30"
                    : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </a>
            ))}
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 h-16 bg-sidebar border-b border-sidebar-border flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex items-center gap-4">
            {/* Balance */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-elevated border border-border">
              <Wallet className="h-4 w-4 text-primary" />
              <span className="font-mono font-medium">{balance.toLocaleString()}</span>
              <span className="text-xs text-muted-foreground">credits</span>
            </div>

            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full text-[10px] flex items-center justify-center">
                3
              </span>
            </Button>

            {/* Avatar */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="p-0 h-auto">
                  <Avatar className="h-9 w-9 border-2 border-primary/30">
                    <AvatarImage src="/diverse-avatars.png" />
                    <AvatarFallback className="bg-elevated text-foreground">JD</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuItem>Sign Out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        {children}
      </div>
    </div>
  )
}
