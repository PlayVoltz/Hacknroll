"use client"

import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

interface BackButtonProps {
  onClick?: () => void
}

export function BackButton({ onClick }: BackButtonProps) {
  return (
    <Button
      onClick={onClick}
      variant="outline"
      className="h-10 rounded-xl border-border bg-transparent text-muted-foreground font-semibold hover:bg-muted hover:text-foreground transition-all"
    >
      <ArrowLeft className="mr-2 h-4 w-4" />
      Back
    </Button>
  )
}
