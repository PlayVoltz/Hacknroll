import type { PropsWithChildren } from "react";

export function DarePotFrame({ children }: PropsWithChildren) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-background">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/4 top-1/4 h-96 w-96 animate-pulse rounded-full bg-neon-lime/10 blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 animate-pulse rounded-full bg-magenta/10 blur-[120px] [animation-delay:1s]" />
        <div className="absolute left-1/2 top-1/2 h-64 w-64 animate-pulse rounded-full bg-cyan/10 blur-[100px] [animation-delay:.5s]" />
      </div>
      <div className="relative z-10 p-6 lg:p-10">{children}</div>
    </div>
  );
}

