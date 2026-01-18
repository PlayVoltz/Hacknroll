"use client";

import type { PropsWithChildren } from "react";
import { TopBar } from "./top-bar";

export function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopBar />
      <main className="flex-1 overflow-y-auto overflow-x-hidden p-6">
        <div className="mx-auto w-full max-w-6xl">{children}</div>
      </main>
      <footer className="border-t border-border py-3 px-4 bg-surface">
        <p className="text-xs text-muted text-center">
          18+ Only • Virtual credits for entertainment purposes only • No real money • Play responsibly
        </p>
      </footer>
    </div>
  );
}

