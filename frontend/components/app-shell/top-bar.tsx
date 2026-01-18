"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "../ui/button";
import { apiFetch } from "../../lib/api";
import { useAuth } from "../auth/AuthProvider";
import { Coins, Users, Copy, Check, ChevronDown, LogOut, Plus } from "lucide-react";
import { formatCredits } from "../../lib/credits";

type Group = {
  id: string;
  name: string;
  inviteCode: string;
};

type UserStats = {
  balanceMinor: number;
};

export function TopBar() {
  const router = useRouter();
  const params = useParams();
  const groupId = (params?.groupId as string | undefined) ?? null;
  const { me, loading, logout } = useAuth();

  const [groups, setGroups] = useState<Group[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showJoinGroup, setShowJoinGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [copied, setCopied] = useState(false);

  const activeGroup = useMemo(
    () => (groupId ? groups.find((g) => g.id === groupId) ?? null : null),
    [groups, groupId],
  );

  async function loadGroups() {
    if (!me) return;
    const data = await apiFetch<Group[]>("/api/groups");
    setGroups(data);
  }

  async function loadStats() {
    if (!me || !groupId) return;
    const data = await apiFetch<{ userStats: UserStats }>(
      `/api/groups/${groupId}/activity`,
    );
    setStats(data.userStats);
  }

  useEffect(() => {
    if (loading) return;
    if (!me) {
      setGroups([]);
      setStats(null);
      return;
    }
    void loadGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me, loading]);

  useEffect(() => {
    if (loading) return;
    if (!me || !groupId) {
      setStats(null);
      return;
    }
    void loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, me, loading]);

  const copyInviteCode = () => {
    if (!activeGroup) return;
    navigator.clipboard.writeText(activeGroup.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  async function createGroup() {
    if (!newGroupName.trim()) return;
    const created = await apiFetch<{ id: string }>("/api/groups", {
      method: "POST",
      body: JSON.stringify({
        name: newGroupName.trim(),
        durationDays: 0,
        durationHours: 1,
        durationMinutes: 0,
        isUnlimited: false,
      }),
    });
    setNewGroupName("");
    setShowCreateGroup(false);
    await loadGroups();
    router.push(`/groups/${created.id}`);
  }

  async function joinGroup() {
    if (!joinCode.trim()) return;
    await apiFetch("/api/groups/join", {
      method: "POST",
      body: JSON.stringify({ inviteCode: joinCode.trim() }),
    });
    setJoinCode("");
    setShowJoinGroup(false);
    await loadGroups();
  }

  return (
    <header className="h-16 border-b border-border bg-surface flex items-center justify-between px-4 gap-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-elevated px-3 py-2">
          <Users className="h-4 w-4 text-neon-lime" />
          <select
            className="bg-transparent text-foreground text-sm outline-none max-w-[180px]"
            value={activeGroup?.id ?? ""}
            disabled={!me}
            onChange={(e) => {
              const next = e.target.value;
              if (next) router.push(`/groups/${next}`);
            }}
          >
            <option value="" disabled>
              {me ? "Select Group" : "Login to play"}
            </option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </div>

        {me ? (
          <div className="hidden sm:flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-neon-lime"
              onClick={() => setShowCreateGroup(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-cyan"
              onClick={() => setShowJoinGroup(true)}
            >
              <Users className="h-4 w-4 mr-2" />
              Join
            </Button>
          </div>
        ) : null}

        {activeGroup ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={copyInviteCode}
            className="text-muted-foreground hover:text-foreground gap-1.5"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-neon-lime" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span className="text-xs font-mono">{activeGroup.inviteCode}</span>
          </Button>
        ) : null}
      </div>

      <div className="flex items-center gap-3 ml-auto">
        {me && groupId && stats ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-elevated border border-border">
            <Coins className="w-4 h-4 text-yellow" />
            <span className="font-bold text-foreground">
              {formatCredits(stats.balanceMinor)}
            </span>
          </div>
        ) : null}

        {!loading && me ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-elevated px-2 py-1.5">
              <span className="inline-flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-border bg-surface">
                {me.profileImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={me.profileImageUrl}
                    alt={me.username}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-bold text-muted-foreground">
                    {me.username.slice(0, 1).toUpperCase()}
                  </span>
                )}
              </span>
              <span className="hidden sm:inline text-foreground font-medium">
                {me.username}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-magenta"
              onClick={() => logout()}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="border-border bg-surface-elevated text-foreground"
              onClick={() => router.push("/?auth=login")}
            >
              Login
            </Button>
            <Button
              className="bg-neon-lime text-background hover:bg-neon-lime/90"
              onClick={() => router.push("/?auth=register")}
            >
              Register
            </Button>
          </div>
        )}
      </div>

      {showCreateGroup ? (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setShowCreateGroup(false)}
            role="button"
            aria-label="Close"
          />
          <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-surface p-6 neon-glow">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">Create a New Group</h2>
                <p className="text-sm text-muted-foreground">
                  Give your squad a name.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCreateGroup(false)}
              >
                Close
              </Button>
            </div>

            <form
              className="mt-4 space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                void createGroup();
              }}
            >
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Group name</label>
                <input
                  className="w-full rounded-md border border-border bg-surface-elevated px-3 py-2 placeholder:text-muted-foreground"
                  placeholder="The Degenerates"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                />
              </div>
              <Button className="w-full bg-neon-lime text-background hover:bg-neon-lime/90">
                Create Group
              </Button>
            </form>
          </div>
        </div>
      ) : null}

      {showJoinGroup ? (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setShowJoinGroup(false)}
            role="button"
            aria-label="Close"
          />
          <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-surface p-6 neon-glow">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">Join a Group</h2>
                <p className="text-sm text-muted-foreground">
                  Paste an invite code from a friend.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowJoinGroup(false)}
              >
                Close
              </Button>
            </div>

            <form
              className="mt-4 space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                void joinGroup();
              }}
            >
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">
                  Invite code
                </label>
                <input
                  className="w-full rounded-md border border-border bg-surface-elevated px-3 py-2 placeholder:text-muted-foreground font-mono uppercase"
                  placeholder="A1B2C3D4"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                />
              </div>
              <Button className="w-full bg-cyan text-background hover:bg-cyan/90">
                Join Group
              </Button>
            </form>
          </div>
        </div>
      ) : null}
    </header>
  );
}

