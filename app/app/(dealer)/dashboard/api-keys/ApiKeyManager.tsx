"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/Field";

type KeyData = {
  id: string;
  name: string;
  key: string;
  lastUsedAt: Date | null;
  createdAt: Date;
};

export function ApiKeyManager({ existingKeys }: { existingKeys: KeyData[] }) {
  const [keys, setKeys] = useState(existingKeys);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [revoking, setRevoking] = useState<string | null>(null);

  const createKey = useCallback(async () => {
    if (!newName.trim()) return;
    setCreating(true);
    const res = await fetch("/api/dealer/api-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    if (res.ok) {
      const key = await res.json();
      setKeys((prev) => [key, ...prev]);
      setNewName("");
    }
    setCreating(false);
  }, [newName]);

  const revokeKey = useCallback(async (id: string) => {
    setRevoking(id);
    const res = await fetch(`/api/dealer/api-keys?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setKeys((prev) => prev.filter((k) => k.id !== id));
    }
    setRevoking(null);
  }, []);

  return (
    <div className="space-y-4">
      <div className="border-border-default bg-background rounded-lg border p-4">
        <p className="text-sm font-semibold">Create a new API key</p>
        <div className="mt-3 flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Key name (e.g. Website integration)"
            className="focus:border-brand-red flex-1 rounded-md border px-3 py-2 text-sm outline-none"
          />
          <Button
            type="button"
            onClick={createKey}
            disabled={creating || !newName.trim()}
          >
            {creating ? "Creating…" : "Create"}
          </Button>
        </div>
      </div>

      {keys.length === 0 ? (
        <div className="border-border-default bg-background rounded-lg border border-dashed p-8 text-center text-sm text-zinc-500">
          No API keys yet. Create one to access the Wheewise API.
        </div>
      ) : (
        <div className="border-border-default bg-background rounded-lg border">
          {keys.map((k) => (
            <div
              key={k.id}
              className="flex items-center justify-between border-b px-4 py-3 last:border-0"
            >
              <div>
                <span className="text-sm font-semibold">{k.name}</span>
                <p className="mt-0.5 font-mono text-xs text-zinc-500">{k.key}</p>
                <p className="text-[11px] text-zinc-400">
                  Created {new Date(k.createdAt).toLocaleDateString()}
                  {k.lastUsedAt
                    ? ` · Last used ${new Date(k.lastUsedAt).toLocaleDateString()}`
                    : " · Never used"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => revokeKey(k.id)}
                disabled={revoking === k.id}
                className="text-brand-red text-xs font-medium hover:underline"
              >
                {revoking === k.id ? "…" : "Revoke"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
