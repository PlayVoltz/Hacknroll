import type { PropsWithChildren } from "react";
import { cn } from "../../lib/utils";

export function Card({
  className,
  children,
}: PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={cn(
        "glass-card neon-glow rounded-lg border border-border p-6 text-card-foreground",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
}: PropsWithChildren<{ className?: string }>) {
  return <h2 className={cn("text-xl font-semibold", className)}>{children}</h2>;
}

export function CardDescription({
  className,
  children,
}: PropsWithChildren<{ className?: string }>) {
  return (
    <p className={cn("text-sm text-muted-foreground", className)}>{children}</p>
  );
}
