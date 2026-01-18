"use client";

import { useState } from "react";

export function FairnessAccordion() {
  const [open, setOpen] = useState(false);
  const [clientSeed, setClientSeed] = useState("abc123xyz");
  const [copied, setCopied] = useState(false);

  // Zip UI parity (mock values)
  const serverSeedHash =
    "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
  const nonce = 42;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(serverSeedHash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  function handleRotateSeed() {
    setClientSeed(Math.random().toString(36).substring(2, 15));
  }

  return (
    <div className="bg-elevated rounded-2xl border border-border">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full px-4 py-3 flex items-center justify-between"
      >
        <span className="text-sm font-medium">Fairness</span>
        <span className="text-xs text-muted-foreground">{open ? "Hide" : "Show"}</span>
      </button>
      {open ? (
        <div className="px-4 pb-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">Client Seed (editable)</div>
              <input
                value={clientSeed}
                onChange={(e) => setClientSeed(e.target.value)}
                className="w-full bg-deep-surface border border-border rounded-md px-3 py-2 font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">Server Seed Hash</div>
              <div className="flex gap-2">
                <input
                  value={serverSeedHash}
                  readOnly
                  className="w-full bg-deep-surface border border-border rounded-md px-3 py-2 font-mono text-xs"
                />
                <button
                  onClick={handleCopy}
                  className="shrink-0 rounded-md border border-border bg-transparent px-3 py-2 hover:bg-surface-elevated text-sm"
                >
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">Nonce</div>
              <input
                value={nonce}
                readOnly
                className="w-full bg-deep-surface border border-border rounded-md px-3 py-2 font-mono"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleRotateSeed}
                className="flex-1 rounded-md border border-border bg-transparent px-3 py-2 text-sm hover:bg-surface-elevated"
              >
                Rotate Seed
              </button>
              <button
                className="flex-1 rounded-md border border-border bg-transparent px-3 py-2 text-sm hover:bg-surface-elevated"
              >
                Verify
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

