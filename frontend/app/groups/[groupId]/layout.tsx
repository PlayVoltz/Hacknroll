import type { ReactNode } from "react";
import Link from "next/link";
import { DarePotFrame } from "../../../components/ui/darepot-frame";

export default function GroupLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { groupId: string };
}) {
  const groupId = params.groupId;
  const tabs = [
    { href: `/groups/${groupId}`, label: "Leaderboard" },
    { href: `/groups/${groupId}/games`, label: "Games" },
    { href: `/groups/${groupId}/logs`, label: "Logs" },
    { href: `/groups/${groupId}/send`, label: "Send" },
  ];

  return (
    <DarePotFrame>
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="rounded-md border border-border bg-surface-elevated px-3 py-2 text-sm font-semibold hover:bg-surface"
            >
              {t.label}
            </Link>
          ))}
        </div>
        {children}
      </div>
    </DarePotFrame>
  );
}

