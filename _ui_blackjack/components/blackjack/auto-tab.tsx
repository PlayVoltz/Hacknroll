"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

export function AutoTab() {
  const [numberOfHands, setNumberOfHands] = useState(10)
  const [strategy, setStrategy] = useState("basic")
  const [stopOnProfit, setStopOnProfit] = useState(false)
  const [stopOnLoss, setStopOnLoss] = useState(false)
  const [profitAmount, setProfitAmount] = useState(1000)
  const [lossAmount, setLossAmount] = useState(500)
  const [isRunning, setIsRunning] = useState(false)

  return (
    <div className="space-y-6">
      {/* Number of Hands */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-muted-foreground">Number of hands</Label>
        <Input
          type="number"
          value={numberOfHands}
          onChange={(e) => setNumberOfHands(Number.parseInt(e.target.value) || 0)}
          className="bg-deep-surface border-border font-mono"
          disabled={isRunning}
        />
      </div>

      {/* Strategy */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-muted-foreground">Strategy</Label>
        <Select value={strategy} onValueChange={setStrategy} disabled={isRunning}>
          <SelectTrigger className="bg-deep-surface border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="basic">Basic Strategy</SelectItem>
            <SelectItem value="conservative">Conservative</SelectItem>
            <SelectItem value="aggressive">Aggressive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stop Conditions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="stop-profit" className="text-sm">
            Stop on profit
          </Label>
          <Switch id="stop-profit" checked={stopOnProfit} onCheckedChange={setStopOnProfit} disabled={isRunning} />
        </div>
        {stopOnProfit && (
          <div className="relative">
            <Input
              type="number"
              value={profitAmount}
              onChange={(e) => setProfitAmount(Number.parseInt(e.target.value) || 0)}
              className="bg-deep-surface border-border pr-16 font-mono"
              disabled={isRunning}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">credits</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <Label htmlFor="stop-loss" className="text-sm">
            Stop on loss
          </Label>
          <Switch id="stop-loss" checked={stopOnLoss} onCheckedChange={setStopOnLoss} disabled={isRunning} />
        </div>
        {stopOnLoss && (
          <div className="relative">
            <Input
              type="number"
              value={lossAmount}
              onChange={(e) => setLossAmount(Number.parseInt(e.target.value) || 0)}
              className="bg-deep-surface border-border pr-16 font-mono"
              disabled={isRunning}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">credits</span>
          </div>
        )}
      </div>

      {/* Status */}
      {isRunning && (
        <Badge className="w-full justify-center py-2 bg-primary/10 text-primary border border-primary/30">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse mr-2" />
          Autobet running...
        </Badge>
      )}

      {/* CTA */}
      <Button
        onClick={() => setIsRunning(!isRunning)}
        className={`w-full h-12 font-bold ${
          isRunning
            ? "bg-destructive text-white hover:bg-destructive/90"
            : "bg-primary text-primary-foreground hover:bg-primary/90 neon-glow"
        }`}
      >
        {isRunning ? "STOP" : "START AUTOBET"}
      </Button>
    </div>
  )
}
