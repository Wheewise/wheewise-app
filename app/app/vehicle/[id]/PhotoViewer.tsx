"use client";

import { useState } from "react";
import { PhotoGallery } from "./PhotoGallery";
import { SpinViewer } from "@/components/vehicle/SpinViewer";

export function PhotoViewer({
  photos,
  photos360,
}: {
  photos: string[];
  photos360: string[];
}) {
  const [mode, setMode] = useState<"gallery" | "360">(
    photos360.length > 0 ? "360" : "gallery",
  );

  if (photos360.length === 0) {
    return <PhotoGallery photos={photos} />;
  }

  return (
    <div>
      {mode === "360" ? (
        <SpinViewer photos={photos360} />
      ) : (
        <PhotoGallery photos={photos} />
      )}
      <div className="mt-2 flex justify-center gap-2">
        <button
          type="button"
          onClick={() => setMode("gallery")}
          className={`rounded px-3 py-1 text-xs font-medium ${
            mode === "gallery"
              ? "bg-brand-red text-white"
              : "bg-surface-muted text-zinc-500"
          }`}
        >
          Photos
        </button>
        <button
          type="button"
          onClick={() => setMode("360")}
          className={`rounded px-3 py-1 text-xs font-medium ${
            mode === "360" ? "bg-brand-red text-white" : "bg-surface-muted text-zinc-500"
          }`}
        >
          360° Spin
        </button>
      </div>
    </div>
  );
}
