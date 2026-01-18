"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useApp } from "@/lib/app-context"
import { Loader2, AlertCircle, CheckCircle } from "lucide-react"

interface AuthModalProps {
  open: boolean
  onClose: () => void
}

export default function AuthModal({ open, onClose }: AuthModalProps) {
  const { login, register } = useApp()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [loginForm, setLoginForm] = useState({ username: "", password: "" })
  const [registerForm, setRegisterForm] = useState({ username: "", password: "", confirmPassword: "" })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    const result = await login(loginForm.username, loginForm.password)
    setIsLoading(false)

    if (result.ok) {
      onClose()
    } else {
      setError(result.error || "Invalid username or password.")
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (registerForm.password !== registerForm.confirmPassword) {
      setError("Passwords don't match!")
      return
    }

    if (registerForm.username.length < 3) {
      setError("Username must be at least 3 characters!")
      return
    }

    setIsLoading(true)
    const result = await register(registerForm.username, registerForm.password)
    setIsLoading(false)

    if (result.ok) {
      setSuccess("Account created! Welcome to DarePot!")
      setTimeout(() => {
        onClose()
      }, 1000)
    } else {
      const msg = result.error || "Could not create account."
      // Friendlier copy for common cases
      if (/signups not allowed/i.test(msg)) {
        setError("Signups are disabled in Supabase. Enable Email signups in the Supabase dashboard.")
      } else if (/duplicate key value|profiles_username_unique|username/i.test(msg)) {
        setError("That username is already taken. Try another one.")
      } else if (/Database error saving new user/i.test(msg)) {
        setError("Supabase database error creating user. This usually means your SQL migrations/triggers aren’t set up yet.")
      } else {
        setError(msg)
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-surface border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground text-center">
            Welcome to <span className="text-gradient">DarePot</span>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="login" className="mt-4">
          <TabsList className="grid w-full grid-cols-2 bg-surface-elevated">
            <TabsTrigger value="login" className="data-[state=active]:bg-neon-lime data-[state=active]:text-background">
              Login
            </TabsTrigger>
            <TabsTrigger
              value="register"
              className="data-[state=active]:bg-neon-lime data-[state=active]:text-background"
            >
              Register
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="mt-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-username" className="text-foreground">
                  Username
                </Label>
                <Input
                  id="login-username"
                  placeholder="Enter your username"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                  className="bg-surface-elevated border-border text-foreground placeholder:text-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password" className="text-foreground">
                  Password
                </Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="Enter your password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  className="bg-surface-elevated border-border text-foreground placeholder:text-muted"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-magenta text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-neon-lime text-background hover:bg-neon-lime-glow font-semibold"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  "Let's Go!"
                )}
              </Button>
            </form>

            <p className="text-xs text-muted text-center mt-4">
              Choose a username + password. Your username stays public; your password is never shown.
            </p>
          </TabsContent>

          <TabsContent value="register" className="mt-6">
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="register-username" className="text-foreground">
                  Username
                </Label>
                <Input
                  id="register-username"
                  placeholder="Choose a legendary username"
                  value={registerForm.username}
                  onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                  className="bg-surface-elevated border-border text-foreground placeholder:text-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-password" className="text-foreground">
                  Password
                </Label>
                <Input
                  id="register-password"
                  type="password"
                  placeholder="Create a password"
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                  className="bg-surface-elevated border-border text-foreground placeholder:text-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-confirm" className="text-foreground">
                  Confirm Password
                </Label>
                <Input
                  id="register-confirm"
                  type="password"
                  placeholder="Confirm your password"
                  value={registerForm.confirmPassword}
                  onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                  className="bg-surface-elevated border-border text-foreground placeholder:text-muted"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-magenta text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="flex items-center gap-2 text-neon-lime text-sm">
                  <CheckCircle className="w-4 h-4" />
                  <span>{success}</span>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-neon-lime text-background hover:bg-neon-lime-glow font-semibold"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
