"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "../../../../lib/api";
import { formatCredits } from "../../../../lib/credits";
import { Card, CardDescription, CardTitle } from "../../../../components/ui/card";
import { PageTitle } from "../../../../components/ui/shell";

type ActivityEntry = {
  id: string;
  createdAt: string;
  username: string;
  type: string;
  amountMinor: number;
  description?: string;
  resultingBalanceMinor: number;
};

export default function GroupLogsPage() {
  const params = useParams();
  const groupId = params.groupId as string;
  const [entries, setEntries] = useState<ActivityEntry[]>([]);

  useEffect(() => {
    async function load() {
      const data = await apiFetch<{ latestEntries: ActivityEntry[] }>(
        `/api/groups/${groupId}/activity`,
      );
      setEntries(data.latestEntries);
    }
    load();
  }, [groupId]);

  return (
    <main className="space-y-6">
      <PageTitle title="Logs" subtitle="All recent group events." />
      <Card>
        <div>
          <CardTitle>Activity</CardTitle>
          <CardDescription>Newest first.</CardDescription>
        </div>
        <div className="mt-4 space-y-2 text-sm">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-start justify-between gap-4 rounded-md border border-border bg-surface-elevated px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate">
                  <span className="font-semibold">{entry.username}</span>{" "}
                  <span className="text-muted-foreground">• {entry.type}</span>{" "}
                  <span
                    className={
                      entry.amountMinor >= 0 ? "text-neon-lime" : "text-destructive"
                    }
                  >
                    {entry.amountMinor >= 0 ? "+" : "-"}
                    {formatCredits(Math.abs(entry.amountMinor))}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {entry.description || "—"} •{" "}
                  {new Date(entry.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                Bal
                <div className="font-mono text-foreground">
                  {formatCredits(entry.resultingBalanceMinor)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </main>
  );
}

