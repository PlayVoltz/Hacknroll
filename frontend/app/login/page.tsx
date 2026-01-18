"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/?auth=login");
  }, [router]);

  return (
    <main className="text-sm text-muted-foreground">Opening login…</main>
  );
}
