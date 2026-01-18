import type { ButtonHTMLAttributes, PropsWithChildren } from "react";
import { cn } from "../../lib/utils";

type Props = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "outline" | "ghost";
    size?: "sm" | "md";
  }
>;

export function Button({
  className,
  children,
  variant = "primary",
  size = "md",
  ...props
}: Props) {
  const base =
    "inline-flex items-center justify-center rounded-md font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none";
  const sizes = size === "sm" ? "px-3 py-2 text-sm" : "px-4 py-2";
  const variants =
    variant === "primary"
      ? "bg-primary text-primary-foreground neon-glow-hover"
      : variant === "outline"
      ? "border border-border bg-transparent hover:bg-surface-elevated"
      : "bg-transparent hover:bg-surface-elevated";

  return (
    <button className={cn(base, sizes, variants, className)} {...props}>
      {children}
    </button>
  );
}

