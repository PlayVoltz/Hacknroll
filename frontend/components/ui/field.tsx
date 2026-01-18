import type { InputHTMLAttributes, PropsWithChildren } from "react";
import { cn } from "../../lib/utils";

export function Field({
  label,
  hint,
  children,
}: PropsWithChildren<{ label?: string; hint?: string }>) {
  return (
    <div className="space-y-1">
      {label ? <label className="text-sm text-muted-foreground">{label}</label> : null}
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "w-full rounded-md border border-border bg-surface-elevated px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring",
        props.className,
      )}
    />
  );
}

