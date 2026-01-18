"use client";

import { useParams, useRouter } from "next/navigation";
import { PageTitle } from "../../../../components/ui/shell";
import { BlackjackPage as BlackjackGamePage } from "../../../../components/blackjack/blackjack-page";

export default function BlackjackRoutePage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.groupId as string;

  return (
    <main className="space-y-6">
      <PageTitle
        title="Blackjack"
        subtitle="Beat the dealer to 21."
        right={
          <button
            onClick={() => router.push(`/groups/${groupId}`)}
            className="rounded-md border border-border px-3 py-2 hover:bg-surface-elevated"
          >
            Back
          </button>
        }
      />

      <div className="-mx-6 -mb-6 lg:-mx-8 lg:-mb-8">
        <BlackjackGamePage groupId={groupId} />
      </div>
    </main>
  );
}
