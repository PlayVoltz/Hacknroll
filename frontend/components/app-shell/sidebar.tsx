"use client";

import type React from "react";
import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { cn } from "../../lib/utils";
import {
  Home,
  Trophy,
  ScrollText,
  Send,
  Gamepad2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "../ui/button";

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
  isActive: (pathname: string) => boolean;
};

export function AppSidebar({
  collapsed,
  onToggleCollapse,
}: {
  collapsed: boolean;
  onToggleCollapse: () => void;
}) {
  const pathname = usePathname();
  const params = useParams();
  const groupId = (params?.groupId as string | undefined) ?? null;

  const navItems = useMemo<NavItem[]>(() => {
    const groupBase = groupId ? `/groups/${groupId}` : "/groups";
    return [
      {
        label: "Home",
        href: "/",
        icon: <Home className="h-5 w-5" />,
        isActive: (p) => p === "/",
      },
      {
        label: "Games",
        href: groupId ? `${groupBase}/games` : "/",
        icon: <Gamepad2 className="h-5 w-5" />,
        isActive: (p) => p.includes("/games") || p.includes("/coinflip") || p.includes("/roulette") || p.includes("/mines") || p.includes("/plinko") || p.includes("/blackjack"),
      },
      {
        label: "Leaderboard",
        href: groupId ? groupBase : "/",
        icon: <Trophy className="h-5 w-5" />,
        isActive: (p) => groupId ? p === groupBase : false,
      },
      {
        label: "Logs",
        href: groupId ? `${groupBase}/logs` : "/",
        icon: <ScrollText className="h-5 w-5" />,
        isActive: (p) => p.includes("/logs"),
      },
      {
        label: "Send",
        href: groupId ? `${groupBase}/send` : "/",
        icon: <Send className="h-5 w-5" />,
        isActive: (p) => p.includes("/send"),
      },
    ];
  }, [groupId]);

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col bg-surface border-r border-border transition-all duration-300",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-4 border-b border-border",
          collapsed && "justify-center px-2",
        )}
      >
        <div className="w-10 h-10 rounded-xl bg-neon-lime flex items-center justify-center shrink-0">
          <Gamepad2 className="w-6 h-6 text-background" />
        </div>
        {!collapsed && <span className="text-xl font-bold text-foreground">DarePot</span>}
      </div>

      <nav className="flex-1 py-4 px-2">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const active = item.isActive(pathname);
            const disabled = item.href === "/" ? false : !groupId && item.label !== "Home";
            return (
              <li key={item.label}>
                {disabled ? (
                  <button
                    disabled
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all opacity-50 cursor-not-allowed",
                      collapsed && "justify-center px-2",
                    )}
                    title="Select a group first"
                  >
                    {item.icon}
                    {!collapsed && <span className="font-medium">{item.label}</span>}
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all",
                      active
                        ? "bg-neon-lime/10 text-neon-lime"
                        : "text-muted-foreground hover:text-foreground hover:bg-surface-elevated",
                      collapsed && "justify-center px-2",
                    )}
                  >
                    {item.icon}
                    {!collapsed && <span className="font-medium">{item.label}</span>}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-2 border-t border-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className={cn(
            "w-full text-muted-foreground hover:text-foreground",
            collapsed && "px-2",
          )}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4 mr-2" />
              Collapse
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}

