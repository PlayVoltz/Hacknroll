"use client"
import LandingPage from "@/components/landing-page"
import AuthenticatedApp from "@/components/authenticated-app"
import { AppProvider, useApp } from "@/lib/app-context"

function AppContent() {
  const { user } = useApp()

  if (!user) {
    return <LandingPage />
  }

  return <AuthenticatedApp />
}

export default function Home() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}
