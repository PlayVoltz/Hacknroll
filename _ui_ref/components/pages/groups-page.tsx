"use client"

import { useApp } from "@/lib/app-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users, Plus, Copy, Check, Clock, Sparkles, UserPlus, X } from "lucide-react"
import { useState } from "react"
import { mockUsers } from "@/lib/mock-data"

export default function GroupsPage() {
  const { user, groups, activeGroup, setActiveGroup, seasons, joinGroup } = useApp()
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [joinCode, setJoinCode] = useState("")
  const [joinError, setJoinError] = useState("")
  const [joinSuccess, setJoinSuccess] = useState(false)

  const userGroups = groups.filter((g) => g.members.includes(user?.id || ""))

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const handleJoinGroup = () => {
    setJoinError("")
    setJoinSuccess(false)

    if (!joinCode.trim()) {
      setJoinError("Please enter an invite code")
      return
    }

    const success = joinGroup(joinCode.trim())
    if (success) {
      setJoinSuccess(true)
      setTimeout(() => {
        setShowJoinModal(false)
        setJoinCode("")
        setJoinSuccess(false)
      }, 1500)
    } else {
      setJoinError("Invalid code or you're already a member")
    }
  }

  const getMemberData = (memberId: string) => {
    return mockUsers.find((u) => u.id === memberId)
  }

  const getGroupSeasons = (groupId: string) => {
    return seasons.filter((s) => s.groupId === groupId)
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Groups</h1>
          <p className="text-muted-foreground">Manage your friend groups and seasons</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="border-neon-lime/50 text-neon-lime hover:bg-neon-lime/10 bg-transparent"
            onClick={() => setShowJoinModal(true)}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Join Group
          </Button>
          <Button className="bg-neon-lime text-background hover:bg-neon-lime-glow font-semibold">
            <Plus className="w-4 h-4 mr-2" />
            Create Group
          </Button>
        </div>
      </div>

      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md mx-4 p-6 rounded-2xl bg-surface border border-border animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-neon-lime" />
                Join a Group
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowJoinModal(false)
                  setJoinCode("")
                  setJoinError("")
                  setJoinSuccess(false)
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <p className="text-muted-foreground mb-4">
              Enter the invite code shared by your friend to join their group.
            </p>

            <div className="space-y-4">
              <div>
                <Input
                  placeholder="Enter invite code (e.g. ABC123)"
                  value={joinCode}
                  onChange={(e) => {
                    setJoinCode(e.target.value.toUpperCase())
                    setJoinError("")
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleJoinGroup()}
                  className="bg-surface-elevated border-border text-foreground placeholder:text-muted-foreground font-mono text-center text-lg tracking-widest"
                  maxLength={10}
                />
                {joinError && <p className="text-sm text-magenta mt-2">{joinError}</p>}
                {joinSuccess && (
                  <p className="text-sm text-neon-lime mt-2 flex items-center gap-1">
                    <Check className="w-4 h-4" />
                    Successfully joined group!
                  </p>
                )}
              </div>

              <Button
                onClick={handleJoinGroup}
                disabled={joinSuccess}
                className="w-full bg-neon-lime text-background hover:bg-neon-lime-glow font-semibold"
              >
                {joinSuccess ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Joined!
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Join Group
                  </>
                )}
              </Button>
            </div>

            <div className="mt-6 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground text-center">
                Don't have a code? Ask a friend to share their group's invite code, or create your own group.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {userGroups.map((group) => {
          const groupSeasons = getGroupSeasons(group.id)
          const activeSeason = groupSeasons.find((s) => s.status === "active")
          const isActive = activeGroup?.id === group.id

          return (
            <div
              key={group.id}
              className={`p-6 rounded-2xl border transition-all ${
                isActive ? "bg-neon-lime/5 border-neon-lime/30" : "bg-surface border-border hover:border-border/80"
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                    <Users className="w-5 h-5 text-neon-lime" />
                    {group.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {group.members.length} members • {groupSeasons.length} seasons
                  </p>
                </div>
                {!isActive && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveGroup(group)}
                    className="border-border text-foreground"
                  >
                    Switch
                  </Button>
                )}
                {isActive && (
                  <span className="px-2 py-1 text-xs font-semibold bg-neon-lime/20 text-neon-lime rounded-full">
                    Active
                  </span>
                )}
              </div>

              <div className="flex -space-x-2 mb-4">
                {group.members.slice(0, 5).map((memberId) => {
                  const member = getMemberData(memberId)
                  return (
                    <Avatar key={memberId} className="w-8 h-8 border-2 border-surface">
                      <AvatarImage src={member?.avatar || "/placeholder.svg"} />
                      <AvatarFallback className="bg-surface-elevated text-foreground text-xs">
                        {member?.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )
                })}
                {group.members.length > 5 && (
                  <div className="w-8 h-8 rounded-full bg-surface-elevated border-2 border-surface flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">+{group.members.length - 5}</span>
                  </div>
                )}
              </div>

              {activeSeason ? (
                <div className="p-3 rounded-xl bg-surface-elevated border border-border mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-neon-lime" />
                      <span className="font-medium text-foreground">{activeSeason.name}</span>
                    </div>
                    <div className="flex items-center gap-1 text-yellow text-sm">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Active</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-surface-elevated border border-dashed border-border mb-4 text-center">
                  <p className="text-sm text-muted-foreground">No active season</p>
                </div>
              )}

              <div className="flex items-center justify-between p-3 rounded-xl bg-surface-elevated">
                <div>
                  <span className="text-xs text-muted-foreground">Invite Code</span>
                  <div className="font-mono font-bold text-foreground">{group.inviteCode}</div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyCode(group.inviteCode)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {copiedCode === group.inviteCode ? (
                    <Check className="w-4 h-4 text-neon-lime" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      {userGroups.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No groups yet</h3>
          <p className="text-muted-foreground mb-4">Create or join a group to start playing!</p>
          <div className="flex gap-3 justify-center">
            <Button
              variant="outline"
              className="border-neon-lime/50 text-neon-lime hover:bg-neon-lime/10 bg-transparent"
              onClick={() => setShowJoinModal(true)}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Join Group
            </Button>
            <Button className="bg-neon-lime text-background hover:bg-neon-lime-glow font-semibold">
              <Plus className="w-4 h-4 mr-2" />
              Create Group
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
