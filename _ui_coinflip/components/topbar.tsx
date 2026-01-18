"use client"

import { Menu, Bell, Coins } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface TopBarProps {
  balance: number
  onMenuClick: () => void
}

export function TopBar({ balance, onMenuClick }: TopBarProps) {
  return (
    <header className="h-16 bg-[#0C0F11] border-b border-[#2a2a2a] flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-4">
        <button onClick={onMenuClick} className="lg:hidden p-2 hover:bg-[#211E21] rounded-xl transition-colors">
          <Menu className="w-5 h-5 text-[#9DA6A3]" />
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#211E21]">
          <Coins className="w-4 h-4 text-[#F8C840]" />
          <span className="text-sm font-bold text-white">{balance.toLocaleString()}</span>
          <span className="text-xs text-[#778184]">credits</span>
        </div>

        <button className="p-2 hover:bg-[#211E21] rounded-xl transition-colors relative">
          <Bell className="w-5 h-5 text-[#9DA6A3]" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#E04890] rounded-full" />
        </button>

        <Avatar className="w-9 h-9 border-2 border-[#2a2a2a]">
          <AvatarImage src="/avatar-gaming.jpg" />
          <AvatarFallback className="bg-[#423941] text-white">JD</AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
