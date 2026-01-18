"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "../../../../lib/api";
import { creditsToMinor } from "../../../../lib/credits";
import { normalizeNumberInput } from "../../../../lib/inputs";
import { getErrorMessage } from "../../../../lib/errors";
import { PageTitle } from "../../../../components/ui/shell";

export default function GroupSendCreditsPage() {
  const params = useParams();
  const groupId = params.groupId as string;

  const [toUsername, setToUsername] = useState("");
  const [amountCredits, setAmountCredits] = useState<number | null>(null);
  const [status, setStatus] = useState<string>("ACTIVE");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const group = await apiFetch<{ status: string }>(`/api/groups/${groupId}`);
        setStatus(group.status);
      } catch {
        // ignore
      }
    }
    load();
  }, [groupId]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      if (status !== "ACTIVE") throw new Error("Group is frozen");
      if (!toUsername) throw new Error("Recipient username required");
      if (!amountCredits || amountCredits <= 0) throw new Error("Amount required");
      await apiFetch(`/api/groups/${groupId}/transfer`, {
        method: "POST",
        body: JSON.stringify({
          toUsername,
          amountMinor: creditsToMinor(amountCredits),
        }),
      });
      setToUsername("");
      setAmountCredits(null);
      setMessage("Sent.");
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <main className="space-y-6">
      <PageTitle title="Send credits" subtitle="Transfer to a username in this group." />

      <div className="rounded-2xl border border-border bg-surface p-6">
        <form onSubmit={send} className="space-y-3">
          <div className="space-y-1">
            <input
              className="w-full rounded-md border border-border bg-surface-elevated px-3 py-2 placeholder:text-muted-foreground"
              placeholder="Recipient username"
              value={toUsername}
              onChange={(e) => setToUsername(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Example: Sam</p>
          </div>
          <div className="space-y-1">
            <input
              className="w-full rounded-md border border-border bg-surface-elevated px-3 py-2 placeholder:text-muted-foreground"
              type="number"
              min={1}
              value={amountCredits ?? ""}
              onChange={(e) => setAmountCredits(normalizeNumberInput(e.target.value))}
              placeholder="Amount (credits)"
            />
            <p className="text-xs text-muted-foreground">Example: 250</p>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {message ? <p className="text-sm text-neon-lime">{message}</p> : null}

          <button className="w-full rounded-md bg-neon-lime px-4 py-3 font-bold text-background neon-glow-hover">
            Send
          </button>
        </form>
      </div>
    </main>
  );
}

