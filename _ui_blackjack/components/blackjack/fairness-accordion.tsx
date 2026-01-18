"use client"

import { useState } from "react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy, RefreshCw, CheckCircle } from "lucide-react"

export function FairnessAccordion() {
  const [clientSeed, setClientSeed] = useState("abc123xyz")
  const [copied, setCopied] = useState(false)

  // Mock values
  const serverSeedHash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  const nonce = 42

  const handleCopy = () => {
    navigator.clipboard.writeText(serverSeedHash)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRotateSeed = () => {
    setClientSeed(Math.random().toString(36).substring(2, 15))
  }

  return (
    <Accordion type="single" collapsible className="bg-elevated rounded-2xl border border-border">
      <AccordionItem value="fairness" className="border-none">
        <AccordionTrigger className="px-4 py-3 hover:no-underline">
          <span className="text-sm font-medium">Fairness</span>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4">
          <div className="space-y-4">
            {/* Client Seed */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Client Seed (editable)</Label>
              <Input
                value={clientSeed}
                onChange={(e) => setClientSeed(e.target.value)}
                className="bg-deep-surface border-border font-mono text-sm"
              />
            </div>

            {/* Server Seed Hash */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Server Seed Hash</Label>
              <div className="flex gap-2">
                <Input value={serverSeedHash} readOnly className="bg-deep-surface border-border font-mono text-xs" />
                <Button variant="outline" size="icon" onClick={handleCopy} className="shrink-0 bg-transparent">
                  {copied ? <CheckCircle className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Nonce */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Nonce</Label>
              <Input value={nonce} readOnly className="bg-deep-surface border-border font-mono" />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={handleRotateSeed} className="flex-1 bg-transparent">
                <RefreshCw className="h-4 w-4 mr-2" />
                Rotate Seed
              </Button>
              <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                Verify
              </Button>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
