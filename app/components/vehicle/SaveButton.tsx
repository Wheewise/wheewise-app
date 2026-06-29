"use client";

import { useState, useCallback } from "react";

export function SaveButton({
  listingId,
  initialSaved = false,
}: {
  listingId: string;
  initialSaved?: boolean;
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [pending, setPending] = useState(false);

  const toggle = useCallback(async () => {
    setPending(true);
    const next = !saved;
    try {
      const res = await fetch("/api/wishlist", {
        method: next ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId }),
      });
      if (res.ok) setSaved(next);
    } finally {
      setPending(false);
    }
  }, [listingId, saved]);

  return (
    <button
      onClick={toggle}
      disabled={pending}
      className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
        saved
          ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
          : "border-border-default hover:bg-surface-muted text-zinc-600"
      }`}
      title={saved ? "Remove from wishlist" : "Save to wishlist"}
    >
      <span>{saved ? "♥" : "♡"}</span>
      <span>{saved ? "Saved" : "Save"}</span>
    </button>
  );
}
