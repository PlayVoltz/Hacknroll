"use client"

import { cn } from "@/lib/utils"
import { Home, Gamepad2, Users, Trophy, Flame, BookOpen, LayoutDashboard, Settings, X, Coins } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

const navItems = [
  { icon: Home, label: "Home", href: "/" },
  { icon: Gamepad2, label: "Games", href: "/games" },
  { icon: Users, label: "Groups", href: "/groups" },
  { icon: Trophy, label: "Leaderboard", href: "/leaderboard" },
  { icon: Flame, label: "Dares", href: "/dares" },
  { icon: BookOpen, label: "Ledger", href: "/ledger" },
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Settings, label: "Settings", href: "/settings" },
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={onClose} />}

      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-64 bg-[#0C0F11] border-r border-[#2a2a2a] z-50 transition-transform duration-300",
          "lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between p-5 border-b border-[#2a2a2a]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#38F868] to-[#40F870] flex items-center justify-center">
              <Coins className="w-5 h-5 text-black" />
            </div>
            <span className="font-bold text-lg text-white tracking-tight">DarePot</span>
          </div>
          <button onClick={onClose} className="lg:hidden p-1.5 hover:bg-[#211E21] rounded-lg transition-colors">
            <X className="w-5 h-5 text-[#9DA6A3]" />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href === "/" && pathname.startsWith("/coin-toss"))

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                  isActive ? "bg-[#38F868]/10 text-[#38F868]" : "text-[#9DA6A3] hover:bg-[#211E21] hover:text-white",
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive && "drop-shadow-[0_0_8px_rgba(56,248,104,0.5)]")} />
                <span className="font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[#2a2a2a]">
          <div className="px-4 py-3 rounded-xl bg-[#211E21]">
            <p className="text-xs text-[#778184] mb-1">Season 4</p>
            <p className="text-sm text-white font-medium">12d 8h remaining</p>
          </div>
        </div>
      </aside>
    </>
  )
}
