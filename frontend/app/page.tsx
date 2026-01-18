"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "../lib/api";
import { normalizeNumberInput } from "../lib/inputs";
import { useAuth } from "../components/auth/AuthProvider";
import { DarePotFrame } from "../components/ui/darepot-frame";
import { Card, CardDescription, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Clock, Gamepad2, Plus, UserPlus, Users } from "lucide-react";

export default function HomePage() {
  const { me, loading } = useAuth();

  if (loading) {
    return <main className="text-sm text-muted-foreground">Loading…</main>;
  }

  if (me) {
    return <AuthedHome />;
  }

  return (
    <main className="relative overflow-hidden rounded-2xl border border-border bg-background">
      {/* background blobs (zip-inspired) */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-1/4 h-96 w-96 animate-pulse rounded-full bg-neon-lime/10 blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 animate-pulse rounded-full bg-magenta/10 blur-[120px] [animation-delay:1s]" />
        <div className="absolute left-1/2 top-1/2 h-64 w-64 animate-pulse rounded-full bg-cyan/10 blur-[100px] [animation-delay:.5s]" />
      </div>

      <div className="relative z-10 px-6 py-14 lg:px-12">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neon-lime text-background">
              🎮
            </div>
            <span className="text-2xl font-bold">DarePot</span>
          </div>
          <Link
            href="/?auth=register"
            className="rounded-md bg-neon-lime px-6 py-2 font-semibold text-background neon-glow-hover"
          >
            Play Now
          </Link>
        </header>

        <section className="mx-auto mt-14 max-w-4xl text-center">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface-elevated px-4 py-2">
            <span className="text-neon-lime">✨</span>
            <span className="text-sm text-muted-foreground">
              Virtual credits only. No real money.
            </span>
          </div>

          <h1 className="text-balance text-5xl font-bold leading-tight md:text-7xl">
            Party casino vibes. <span className="text-gradient">Don&apos;t be the brokest.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground md:text-xl">
            Create a group, start with credits, bet with friends, and watch the
            leaderboard move in real-time.
          </p>

          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/?auth=register"
              className="rounded-md bg-neon-lime px-8 py-4 text-lg font-bold text-background neon-glow"
            >
              Start Playing Free
            </Link>
            <Link
              href="/?auth=login"
              className="rounded-md border border-border bg-transparent px-8 py-4 text-lg font-semibold hover:bg-surface-elevated"
            >
              Login
            </Link>
          </div>
        </section>

        {/* Feature cards */}
        <section className="mx-auto mt-16 grid w-full max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-border bg-surface p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-neon-lime/10 text-neon-lime">
              👥
            </div>
            <h3 className="text-xl font-bold">Squad Up</h3>
            <p className="mt-2 text-muted-foreground">
              Create rooms with friends and compete on a live leaderboard.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-magenta/10 text-magenta">
              🏆
            </div>
            <h3 className="text-xl font-bold">Avoid Last Place</h3>
            <p className="mt-2 text-muted-foreground">
              Don&apos;t be the brokest. Groups freeze at the end of the timer.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-cyan/10 text-cyan">
              ⚡
            </div>
            <h3 className="text-xl font-bold">Casino Games</h3>
            <p className="mt-2 text-muted-foreground">
              Coinflip, Mines, Roulette, Blackjack, Plinko, Poker.
            </p>
          </div>
        </section>

        {/* Game preview grid (zip-style tiles with images) */}
        <section className="mx-auto mt-16 w-full max-w-6xl">
          <h2 className="mb-6 text-center text-3xl font-bold">
            Games That Hit Different
          </h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {[
              { name: "Coinflip", img: "/darepot/dice-rolling-neon-glow.jpg" },
              { name: "Blackjack", img: "/darepot/blackjack-cards-casino-neon.jpg" },
              { name: "Mines", img: "/darepot/mines-grid-game-neon-gems.jpg" },
              { name: "Plinko", img: "/darepot/plinko-balls-pyramid-neon.jpg" },
              { name: "Roulette", img: "/darepot/roulette-wheel-casino-neon.jpg" },
              { name: "Poker", img: "/darepot/poker-cards-chips-neon-green.jpg" },
            ].map((g) => (
              <div
                key={g.name}
                className="group relative aspect-square overflow-hidden rounded-2xl border border-border bg-surface neon-glow-hover transition-all hover:border-neon-lime/50"
              >
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
                  style={{ backgroundImage: `url(${g.img})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <span className="font-semibold group-hover:text-neon-lime">
                    {g.name}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Localhost-only • virtual credits only • no real money
          </p>
        </section>

        {/* footer */}
        <footer className="mt-16 border-t border-border pt-8 text-center text-sm text-muted-foreground">
          © 2026 DarePot • Virtual credits only. No real money involved.
        </footer>
      </div>
    </main>
  );
}

type Group = {
  id: string;
  name: string;
  inviteCode: string;
  durationDays: number;
  durationHours: number;
  durationMinutes: number;
  isUnlimited: boolean;
  status: string;
};

function AuthedHome() {
  const router = useRouter();
  const { me } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    durationDays: 0 as number | null,
    durationHours: 1 as number | null,
    durationMinutes: 0 as number | null,
    isUnlimited: false,
  });
  const [inviteCode, setInviteCode] = useState("");

  async function loadGroups() {
    try {
      const data = await apiFetch<Group[]>("/api/groups");
      setGroups(data);
      setError("");
    } catch (err) {
      setError((err as Error).message);
    }
  }

  useEffect(() => {
    loadGroups();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      const created = await apiFetch<Group>("/api/groups", {
        method: "POST",
        body: JSON.stringify({
          ...createForm,
          durationDays: createForm.durationDays ?? 0,
          durationHours: createForm.durationHours ?? 0,
          durationMinutes: createForm.durationMinutes ?? 0,
        }),
      });
      setCreateForm({
        name: "",
        durationDays: 0,
        durationHours: 1,
        durationMinutes: 0,
        isUnlimited: false,
      });
      await loadGroups();
      setShowCreate(false);
      router.push(`/groups/${created.id}`);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    try {
      const joined = await apiFetch<Group>("/api/groups/join", {
        method: "POST",
        body: JSON.stringify({ inviteCode }),
      });
      setInviteCode("");
      await loadGroups();
      setShowJoin(false);
      router.push(`/groups/${joined.id}`);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  const firstGroupId = groups[0]?.id ?? null;

  return (
    <DarePotFrame>
      <main className="space-y-8 max-w-full overflow-hidden">
        {/* Hero (folder-10-ish) */}
        <div className="relative rounded-2xl bg-surface border border-border overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-neon-lime/5 via-transparent to-magenta/5" />
          <div className="relative p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="space-y-3">
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                  Welcome back{me ? `, ${me.username}` : ""}.{" "}
                  <span className="text-gradient">Pick a group and play.</span>
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>{groups.length} groups</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Gamepad2 className="w-4 h-4 text-neon-lime" />
                    <span>Coinflip • Mines • Roulette • Blackjack • Plinko</span>
                  </div>
                  <div className="flex items-center gap-2 text-yellow">
                    <Clock className="w-4 h-4" />
                    <span className="font-medium">Don&apos;t be the brokest</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  className="bg-neon-lime text-background hover:bg-neon-lime/90 font-semibold neon-glow"
                  onClick={() => setShowCreate(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Group
                </Button>
                <Button
                  variant="outline"
                  className="border-neon-lime/40 text-neon-lime hover:bg-neon-lime/10 bg-transparent"
                  onClick={() => setShowJoin(true)}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Join Group
                </Button>
              </div>
            </div>
          </div>
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        {/* Groups */}
        <section className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Your groups</h2>
              <p className="text-muted-foreground">
                Click a group to see the leaderboard and games.
              </p>
            </div>
          </div>

          {groups.length === 0 ? (
            <Card className="text-center p-10">
              <CardTitle>No groups yet</CardTitle>
              <CardDescription>
                Create a group or join with an invite code to start playing.
              </CardDescription>
              <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                <Button
                  className="bg-neon-lime text-background hover:bg-neon-lime/90 font-semibold"
                  onClick={() => setShowCreate(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Group
                </Button>
                <Button
                  variant="outline"
                  className="border-border text-foreground hover:bg-surface-elevated bg-transparent"
                  onClick={() => setShowJoin(true)}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Join Group
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {groups.map((group) => (
                <Link
                  key={group.id}
                  href={`/groups/${group.id}`}
                  className="group"
                >
                  <div className="relative overflow-hidden rounded-2xl border border-border bg-surface transition-all hover:border-neon-lime/40 neon-glow-hover">
                    <div className="absolute inset-0 bg-gradient-to-br from-neon-lime/5 via-transparent to-magenta/5 opacity-0 transition-opacity group-hover:opacity-100" />
                    <div className="relative p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1 min-w-0">
                          <h3 className="text-xl font-bold text-foreground truncate">
                            {group.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Invite{" "}
                            <span className="font-mono text-foreground">
                              {group.inviteCode}
                            </span>{" "}
                            •{" "}
                            {group.isUnlimited
                              ? "Unlimited"
                              : `${group.durationDays}d ${group.durationHours}h ${group.durationMinutes}m`}
                          </p>
                        </div>
                        <span className="rounded-full border border-border bg-surface-elevated px-3 py-1 text-xs uppercase text-muted-foreground">
                          {group.status}
                        </span>
                      </div>
                      <div className="mt-4 flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Open leaderboard →
                        </span>
                        <span className="text-neon-lime font-semibold">
                          Play games →
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Featured games (quick jump) */}
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              Featured games
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {[
              { name: "Coinflip", slug: "coinflip", img: "/darepot/dice-rolling-neon-glow.jpg" },
              { name: "Blackjack", slug: "blackjack", img: "/darepot/blackjack-cards-casino-neon.jpg" },
              { name: "Mines", slug: "mines", img: "/darepot/mines-grid-game-neon-gems.jpg" },
              { name: "Plinko", slug: "plinko", img: "/darepot/plinko-balls-pyramid-neon.jpg" },
              { name: "Roulette", slug: "roulette", img: "/darepot/roulette-wheel-casino-neon.jpg" },
              { name: "Poker", slug: "poker", img: "/darepot/poker-cards-chips-neon-green.jpg" },
            ].map((g) => {
              const href = firstGroupId ? `/groups/${firstGroupId}/${g.slug}` : "/?auth=login";
              return (
                <Link
                  key={g.name}
                  href={firstGroupId ? href : "#"}
                  onClick={(e) => {
                    if (!firstGroupId) {
                      e.preventDefault();
                      setError("Create or join a group first.");
                    }
                  }}
                  className="group relative aspect-square overflow-hidden rounded-2xl border border-border bg-surface neon-glow-hover transition-all hover:border-neon-lime/50"
                >
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
                    style={{ backgroundImage: `url(${g.img})` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <span className="font-semibold group-hover:text-neon-lime">
                      {g.name}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </main>

      {/* Create modal */}
      {showCreate ? (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setShowCreate(false)}
            role="button"
            aria-label="Close"
          />
          <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-surface p-6 neon-glow">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">Create a group</h2>
                <p className="text-sm text-muted-foreground">
                  Pick a duration, or make it unlimited.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowCreate(false)}>
                Close
              </Button>
            </div>

            <form className="mt-5 space-y-3" onSubmit={handleCreate}>
              <input
                className="w-full rounded-md border border-border bg-surface-elevated px-3 py-2 placeholder:text-muted-foreground"
                placeholder="Group name"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              />
              <div className="grid grid-cols-3 gap-2">
                <input
                  className="w-full rounded-md border border-border bg-surface-elevated px-3 py-2 placeholder:text-muted-foreground"
                  type="number"
                  min={0}
                  max={30}
                  value={createForm.durationDays ?? ""}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      durationDays: normalizeNumberInput(e.target.value),
                    })
                  }
                  placeholder="Days"
                />
                <input
                  className="w-full rounded-md border border-border bg-surface-elevated px-3 py-2 placeholder:text-muted-foreground"
                  type="number"
                  min={0}
                  max={23}
                  value={createForm.durationHours ?? ""}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      durationHours: normalizeNumberInput(e.target.value),
                    })
                  }
                  placeholder="Hours"
                />
                <input
                  className="w-full rounded-md border border-border bg-surface-elevated px-3 py-2 placeholder:text-muted-foreground"
                  type="number"
                  min={0}
                  max={59}
                  value={createForm.durationMinutes ?? ""}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      durationMinutes: normalizeNumberInput(e.target.value),
                    })
                  }
                  placeholder="Minutes"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={createForm.isUnlimited}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, isUnlimited: e.target.checked })
                  }
                />
                Unlimited duration
              </label>
              <Button className="w-full bg-neon-lime text-background hover:bg-neon-lime/90">
                Create Group
              </Button>
            </form>
          </div>
        </div>
      ) : null}

      {/* Join modal */}
      {showJoin ? (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setShowJoin(false)}
            role="button"
            aria-label="Close"
          />
          <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-surface p-6 neon-glow">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">Join a group</h2>
                <p className="text-sm text-muted-foreground">
                  Paste an invite code from a friend.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowJoin(false)}>
                Close
              </Button>
            </div>

            <form className="mt-5 space-y-3" onSubmit={handleJoin}>
              <input
                className="w-full rounded-md border border-border bg-surface-elevated px-3 py-2 placeholder:text-muted-foreground font-mono uppercase"
                placeholder="Invite code (e.g. A1B2C3D4)"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              />
              <Button className="w-full bg-cyan text-background hover:bg-cyan/90">
                Join Group
              </Button>
            </form>
          </div>
        </div>
      ) : null}
    </DarePotFrame>
  );
}
