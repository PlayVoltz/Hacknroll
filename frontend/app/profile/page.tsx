"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";
import { getErrorMessage } from "../../lib/errors";
import { useAuth } from "../../components/auth/AuthProvider";
import { DarePotFrame } from "../../components/ui/darepot-frame";
import { PageTitle } from "../../components/ui/shell";

export default function ProfilePage() {
  const { me, refreshMe } = useAuth();
  const [username, setUsername] = useState("");
  const [profileImageUrl, setProfileImageUrl] = useState<string>("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (me) {
      setUsername(me.username);
      setProfileImageUrl(me.profileImageUrl || "");
    }
  }, [me]);

  async function save() {
    setMessage("");
    setError("");
    try {
      await apiFetch("/api/auth/me", {
        method: "PATCH",
        body: JSON.stringify({
          username,
          profileImageUrl: profileImageUrl ? profileImageUrl : null,
        }),
      });
      await refreshMe();
      setMessage("Saved.");
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <DarePotFrame>
      <main className="space-y-6">
        <PageTitle title="Profile" subtitle="Change your username and avatar." />

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-surface p-6">
            <p className="text-sm font-semibold">Preview</p>
            <div className="mt-4 flex items-center gap-4">
              <div className="h-16 w-16 overflow-hidden rounded-2xl border border-border bg-surface-elevated">
                {profileImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profileImageUrl}
                    alt="avatar"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-muted-foreground">
                    {(username || "U").slice(0, 1).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-lg font-bold">{username || "Username"}</p>
                <p className="text-sm text-muted-foreground">
                  {me?.email || "—"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-6">
            <p className="text-sm font-semibold">Settings</p>
            <div className="mt-4 space-y-3">
              <div className="space-y-1">
                <input
                  className="w-full rounded-md border border-border bg-surface-elevated px-3 py-2 placeholder:text-muted-foreground"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Friends use this for transfers and leaderboards.
                </p>
              </div>
              <div className="space-y-1">
                <input
                  className="w-full rounded-md border border-border bg-surface-elevated px-3 py-2 placeholder:text-muted-foreground"
                  placeholder="Profile picture URL (optional)"
                  value={profileImageUrl}
                  onChange={(e) => setProfileImageUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Paste an image URL (png/jpg/webp).
                </p>
              </div>

              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              {message ? (
                <p className="text-sm text-neon-lime">{message}</p>
              ) : null}

              <button
                onClick={save}
                className="w-full rounded-md bg-neon-lime px-4 py-3 font-bold text-background neon-glow-hover"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </main>
    </DarePotFrame>
  );
}

