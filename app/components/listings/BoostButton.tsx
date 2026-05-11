"use client";

import { useState, useCallback } from "react";

export function BoostButton({
  listingId,
  isBoosted,
  boostExpiresAt,
}: {
  listingId: string;
  isBoosted: boolean;
  boostExpiresAt: Date | null;
}) {
  const [boosting, setBoosting] = useState(false);
  const [boosted, setBoosted] = useState(isBoosted);
  const [expiresAt, setExpiresAt] = useState(boostExpiresAt);

  const handleBoost = useCallback(
    async (duration: string) => {
      setBoosting(true);
      try {
        const res = await fetch("/api/dealer/boost", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listingId, duration }),
        });
        if (res.ok) {
          const data = await res.json();
          setBoosted(true);
          setExpiresAt(new Date(data.expiresAt));
        }
      } catch {
        // keep current state
      } finally {
        setBoosting(false);
      }
    },
    [listingId],
  );

  if (boosted && expiresAt && new Date(expiresAt) > new Date()) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
        <span>⚡</span>
        Featured until {new Date(expiresAt).toLocaleDateString()}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-zinc-500">Boost this listing:</span>
      {(["7", "14", "30"] as const).map((d) => (
        <button
          key={d}
          type="button"
          onClick={() => handleBoost(d)}
          disabled={boosting}
          className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100 disabled:opacity-50"
        >
          {d}d
        </button>
      ))}
    </div>
  );
}
