"use client"

import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { CoinTossGame } from "@/components/coin-toss/coin-toss-game"

export default function CoinTossPage() {
  const [balance, setBalance] = useState(10000)

  return (
    <AppShell balance={balance} onBalanceChange={setBalance}>
      <CoinTossGame balance={balance} onBalanceChange={setBalance} />
    </AppShell>
  )
}
