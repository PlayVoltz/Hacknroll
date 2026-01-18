"use client"

import { useState } from "react"
import { useApp } from "@/lib/app-context"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Bell, ChevronDown, Plus, LogOut, Menu, Coins, Users, Copy, Check } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface TopBarProps {
  onToggleSidebar: () => void
}

export default function TopBar({ onToggleSidebar }: TopBarProps) {
  const { user, groups, activeGroup, setActiveGroup, activeSeason, logout, createGroup, joinGroup } = useApp()
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [showJoinGroup, setShowJoinGroup] = useState(false)
  const [newGroupName, setNewGroupName] = useState("")
  const [joinCode, setJoinCode] = useState("")
  const [copied, setCopied] = useState(false)

  const userGroups = groups.filter((g) => g.members.includes(user?.id || ""))
  const currentBalance = activeSeason?.balances[user?.id || ""] ?? 0

  const handleCreateGroup = () => {
    if (newGroupName.trim()) {
      createGroup(newGroupName.trim())
      setNewGroupName("")
      setShowCreateGroup(false)
    }
  }

  const handleJoinGroup = () => {
    if (joinCode.trim()) {
      const success = joinGroup(joinCode.trim())
      if (success) {
        setJoinCode("")
        setShowJoinGroup(false)
      }
    }
  }

  const copyInviteCode = () => {
    if (activeGroup) {
      navigator.clipboard.writeText(activeGroup.inviteCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <header className="h-16 border-b border-border bg-surface flex items-center justify-between px-4 gap-4">
      {/* Mobile Menu Button */}
      <Button variant="ghost" size="icon" className="md:hidden text-foreground" onClick={onToggleSidebar}>
        <Menu className="w-5 h-5" />
      </Button>

      {/* Group Switcher */}
      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="border-border bg-surface-elevated text-foreground gap-2">
              <Users className="w-4 h-4 text-neon-lime" />
              <span className="max-w-[120px] truncate">{activeGroup?.name || "Select Group"}</span>
              <ChevronDown className="w-4 h-4 text-muted" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 bg-surface-elevated border-border">
            <div className="px-2 py-1.5 text-xs font-semibold text-muted">My Groups</div>
            {userGroups.map((group) => (
              <DropdownMenuItem
                key={group.id}
                onClick={() => setActiveGroup(group)}
                className={`cursor-pointer ${activeGroup?.id === group.id ? "bg-neon-lime/10 text-neon-lime" : "text-foreground"}`}
              >
                <Users className="w-4 h-4 mr-2" />
                {group.name}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem onClick={() => setShowCreateGroup(true)} className="text-neon-lime cursor-pointer">
              <Plus className="w-4 h-4 mr-2" />
              Create Group
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowJoinGroup(true)} className="text-cyan cursor-pointer">
              <Users className="w-4 h-4 mr-2" />
              Join Group
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Invite Code */}
        {activeGroup && (
          <Button
            variant="ghost"
            size="sm"
            onClick={copyInviteCode}
            className="text-muted-foreground hover:text-foreground gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-neon-lime" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="text-xs font-mono">{activeGroup.inviteCode}</span>
          </Button>
        )}
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-3 ml-auto">
        {/* Balance */}
        {activeSeason && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-elevated border border-border">
            <Coins className="w-4 h-4 text-yellow" />
            <span className="font-bold text-foreground">{currentBalance.toLocaleString()}</span>
            <span className="text-xs text-muted">credits</span>
          </div>
        )}

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-magenta rounded-full" />
        </Button>

        {/* Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 px-2">
              <Avatar className="w-8 h-8">
                <AvatarImage src={user?.avatar || "/placeholder.svg"} />
                <AvatarFallback className="bg-neon-lime text-background text-sm">
                  {user?.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-foreground font-medium hidden sm:inline">{user?.username}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-surface-elevated border-border">
            <DropdownMenuItem onClick={logout} className="text-magenta cursor-pointer">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Create Group Dialog */}
      <Dialog open={showCreateGroup} onOpenChange={setShowCreateGroup}>
        <DialogContent className="bg-surface border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Create a New Group</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label className="text-foreground">Group Name</Label>
              <Input
                placeholder="The Degenerates"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="bg-surface-elevated border-border text-foreground"
              />
            </div>
            <Button onClick={handleCreateGroup} className="w-full bg-neon-lime text-background hover:bg-neon-lime-glow">
              Create Group
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Join Group Dialog */}
      <Dialog open={showJoinGroup} onOpenChange={setShowJoinGroup}>
        <DialogContent className="bg-surface border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Join a Group</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label className="text-foreground">Invite Code</Label>
              <Input
                placeholder="Enter invite code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                className="bg-surface-elevated border-border text-foreground font-mono uppercase"
              />
            </div>
            <Button onClick={handleJoinGroup} className="w-full bg-cyan text-background hover:bg-cyan/90">
              Join Group
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  )
}
