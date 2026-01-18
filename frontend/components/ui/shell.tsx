"use client";

import type { PropsWithChildren, ReactNode } from "react";
import Link from "next/link";
import { cn } from "../../lib/utils";
import { useAuth } from "../auth/AuthProvider";

export function AppHeader() {
  const { me, loading, logout } = useAuth();

  return (
    <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
      <Link href="/" className="text-2xl font-bold text-gradient">
        DarePot
      </Link>
      <nav className="flex flex-wrap gap-2 text-sm">
        <Link
          href="/"
          className="rounded-md border border-border px-3 py-2 hover:bg-surface-elevated"
        >
          Home
        </Link>

        {!loading && me ? (
          <>
            <Link
              href="/profile"
              className="flex items-center gap-2 rounded-md border border-border bg-surface-elevated px-3 py-2 hover:bg-surface"
            >
              <span className="inline-flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border border-border bg-surface">
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
              <span className="font-semibold">{me.username}</span>
            </Link>
            <button
              onClick={() => logout()}
              className="rounded-md border border-border px-3 py-2 hover:bg-surface-elevated"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link
              href="/?auth=login"
              className="rounded-md border border-border px-3 py-2 hover:bg-surface-elevated"
            >
              Login
            </Link>
            <Link
              href="/?auth=register"
              className="rounded-md bg-neon-lime px-3 py-2 font-semibold text-background neon-glow-hover"
            >
              Register
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}

export function PageTitle({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="space-y-1">
        <h1 className="text-4xl font-bold">{title}</h1>
        {subtitle ? <p className="text-muted-foreground">{subtitle}</p> : null}
      </div>
      {right ? <div className="flex items-center gap-2">{right}</div> : null}
    </div>
  );
}

export function Section({
  className,
  children,
}: PropsWithChildren<{ className?: string }>) {
  return <section className={cn("space-y-3", className)}>{children}</section>;
}

