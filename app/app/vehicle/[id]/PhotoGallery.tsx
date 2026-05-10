"use client";

import { useState } from "react";

export function PhotoGallery({ photos }: { photos: string[] }) {
  const [active, setActive] = useState(0);
  if (photos.length === 0) {
    return (
      <div className="aspect-[4/3] w-full rounded-lg border border-border-default bg-surface-muted" />
    );
  }
  return (
    <div className="space-y-3">
      <div className="aspect-[4/3] overflow-hidden rounded-lg border border-border-default bg-surface-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photos[active]}
          alt=""
          className="h-full w-full object-cover"
        />
      </div>
      {photos.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto">
          {photos.map((url, i) => (
            <button
              key={url}
              type="button"
              onClick={() => setActive(i)}
              className={`flex-shrink-0 overflow-hidden rounded border-2 ${
                i === active ? "border-brand-red" : "border-transparent"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt=""
                className="h-16 w-24 object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
