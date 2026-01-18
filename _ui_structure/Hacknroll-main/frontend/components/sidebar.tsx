"use client"

import type React from "react"

import { cn } from "@/lib/utils"
import type { PageId } from "./authenticated-app"
import {
  Home,
  Users,
  Flame,
  Receipt,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Gamepad2,
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface SidebarProps {
  currentPage: PageId
  onNavigate: (page: PageId) => void
  collapsed: boolean
  onToggleCollapse: () => void
}

const navItems: { id: PageId; label: string; icon: React.ReactNode }[] = [
  { id: "home", label: "Home", icon: <Home className="w-5 h-5" /> },
  { id: "groups", label: "Groups", icon: <Users className="w-5 h-5" /> },
  { id: "dares", label: "Dares", icon: <Flame className="w-5 h-5" /> },
  { id: "ledger", label: "Transactions", icon: <Receipt className="w-5 h-5" /> },
  { id: "dashboard", label: "Dashboard", icon: <BarChart3 className="w-5 h-5" /> },
  { id: "settings", label: "Settings", icon: <Settings className="w-5 h-5" /> },
]

export default function Sidebar({ currentPage, onNavigate, collapsed, onToggleCollapse }: SidebarProps) {
  return (
    <aside
      className={cn(
        "hidden md:flex flex-col bg-surface border-r border-border transition-all duration-300",
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* Logo */}
      <div
        className={cn("flex items-center gap-3 px-4 py-4 border-b border-border", collapsed && "justify-center px-2")}
      >
        <div className="w-10 h-10 rounded-xl bg-neon-lime flex items-center justify-center shrink-0">
          <Gamepad2 className="w-6 h-6 text-background" />
        </div>
        {!collapsed && <span className="text-xl font-bold text-foreground">DarePot</span>}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onNavigate(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all",
                  currentPage === item.id
                    ? "bg-neon-lime/10 text-neon-lime"
                    : "text-muted-foreground hover:text-foreground hover:bg-surface-elevated",
                  collapsed && "justify-center px-2",
                )}
              >
                {item.icon}
                {!collapsed && <span className="font-medium">{item.label}</span>}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Collapse Toggle */}
      <div className="p-2 border-t border-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className={cn("w-full text-muted-foreground hover:text-foreground", collapsed && "px-2")}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4 mr-2" />
              Collapse
            </>
          )}
        </Button>
      </div>
    </aside>
  )
}
