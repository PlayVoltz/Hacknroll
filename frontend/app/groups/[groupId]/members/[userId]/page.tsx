"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "../../../../../lib/api";
import { formatCredits } from "../../../../../lib/credits";
import { Card, CardDescription, CardTitle } from "../../../../../components/ui/card";
import { PageTitle } from "../../../../../components/ui/shell";
import { getErrorMessage } from "../../../../../lib/errors";
import { RadarChart } from "../../../../../components/charts/RadarChart";

type Profile = {
  user: { id: string; username: string };
  stats: {
    balanceMinor: number;
    netChangeMinor: number;
    totalWonMinor: number;
    totalLostMinor: number;
  };
};

export default function MemberProfilePage() {
  const params = useParams();
  const groupId = params.groupId as string;
  const userId = params.userId as string;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [spider, setSpider] = useState<{ axes: { label: string; value: number }[] } | null>(
    null,
  );
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setError("");
        const data = await apiFetch<Profile>(
          `/api/groups/${groupId}/members/${userId}/profile`,
        );
        setProfile(data);
        const spiderData = await apiFetch<{ axes: { label: string; value: number }[] }>(
          `/api/groups/${groupId}/members/${userId}/spider`,
        );
        setSpider(spiderData);
      } catch (err) {
        setError(getErrorMessage(err));
      }
    }
    load();
  }, [groupId, userId]);

  return (
    <main className="space-y-6">
      <PageTitle title="Profile" subtitle="Session stats in this group." />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardTitle>{profile?.user.username || "Loading…"}</CardTitle>
          <CardDescription>User stats for this group.</CardDescription>
          {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
          {profile ? (
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Balance</p>
                <p className="font-semibold">{formatCredits(profile.stats.balanceMinor)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Net</p>
                <p className="font-semibold">{formatCredits(profile.stats.netChangeMinor)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total won</p>
                <p className="font-semibold">{formatCredits(profile.stats.totalWonMinor)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total lost</p>
                <p className="font-semibold">{formatCredits(profile.stats.totalLostMinor)}</p>
              </div>
            </div>
          ) : null}
        </Card>

        <Card>
          <CardTitle>Playstyle</CardTitle>
          <CardDescription>Spider chart (0–100%).</CardDescription>
          <div className="mt-4 flex items-center justify-center">
            {spider ? <RadarChart axes={spider.axes} /> : <p className="text-sm text-muted-foreground">Loading…</p>}
          </div>
          {spider ? (
            <div className="mt-3 space-y-1 text-xs text-muted-foreground">
              {spider.axes.map((a) => (
                <div key={a.label} className="flex items-center justify-between">
                  <span>{a.label}</span>
                  <span className="font-mono text-foreground">{Math.round(a.value * 100)}%</span>
                </div>
              ))}
            </div>
          ) : null}
        </Card>
      </div>
    </main>
  );
}

