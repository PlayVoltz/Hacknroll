"use client"

import { useApp } from "@/lib/app-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Settings, User, Bell, Shield, Volume2, LogOut } from "lucide-react"

export default function SettingsPage() {
  const { user, logout } = useApp()

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
          <Settings className="w-7 h-7 text-muted-foreground" />
          Settings
        </h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      {/* Profile Section */}
      <div className="p-6 rounded-2xl bg-surface border border-border space-y-6">
        <div className="flex items-center gap-2 text-foreground">
          <User className="w-5 h-5" />
          <h3 className="font-bold">Profile</h3>
        </div>

        <div className="flex items-center gap-4">
          <Avatar className="w-16 h-16">
            <AvatarImage src={user?.avatar || "/placeholder.svg"} />
            <AvatarFallback className="bg-neon-lime text-background text-xl">
              {user?.username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-bold text-foreground text-lg">{user?.username}</div>
            <div className="text-sm text-muted-foreground">
              Member since {new Date(user?.createdAt || "").toLocaleDateString()}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-foreground">Username</Label>
            <Input value={user?.username} disabled className="bg-surface-elevated border-border text-foreground" />
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="p-6 rounded-2xl bg-surface border border-border space-y-4">
        <div className="flex items-center gap-2 text-foreground">
          <Bell className="w-5 h-5" />
          <h3 className="font-bold">Notifications</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-foreground">Season Updates</div>
              <div className="text-sm text-muted-foreground">Get notified when a season starts or ends</div>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-foreground">Group Invites</div>
              <div className="text-sm text-muted-foreground">Get notified when someone invites you</div>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-foreground">Dare Reminders</div>
              <div className="text-sm text-muted-foreground">Get reminded about pending dares</div>
            </div>
            <Switch />
          </div>
        </div>
      </div>

      {/* Sound & Display */}
      <div className="p-6 rounded-2xl bg-surface border border-border space-y-4">
        <div className="flex items-center gap-2 text-foreground">
          <Volume2 className="w-5 h-5" />
          <h3 className="font-bold">Sound & Display</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-foreground">Game Sounds</div>
              <div className="text-sm text-muted-foreground">Play sounds during games</div>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-foreground">Win Animations</div>
              <div className="text-sm text-muted-foreground">Show celebration animations on wins</div>
            </div>
            <Switch defaultChecked />
          </div>
        </div>
      </div>

      {/* Privacy */}
      <div className="p-6 rounded-2xl bg-surface border border-border space-y-4">
        <div className="flex items-center gap-2 text-foreground">
          <Shield className="w-5 h-5" />
          <h3 className="font-bold">Privacy</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-foreground">Show on Leaderboard</div>
              <div className="text-sm text-muted-foreground">Allow others to see your stats</div>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-foreground">Profile Visible</div>
              <div className="text-sm text-muted-foreground">Let others find you by username</div>
            </div>
            <Switch defaultChecked />
          </div>
        </div>
      </div>

      {/* Logout */}
      <Button
        variant="outline"
        onClick={logout}
        className="w-full border-magenta text-magenta hover:bg-magenta/10 bg-transparent"
      >
        <LogOut className="w-4 h-4 mr-2" />
        Logout
      </Button>

      {/* 18+ Disclaimer */}
      <div className="p-4 rounded-xl bg-surface-elevated border border-border text-center">
        <p className="text-xs text-muted-foreground">
          🎲 <strong>18+ Only</strong> • DarePot uses virtual credits only. No real money gambling. This is a social
          game for entertainment with friends. Play responsibly.
        </p>
      </div>
    </div>
  )
}
