"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

// Shows on every page load, no exceptions — no storage check, no "seen
// before" tracking. Fully self-contained: runs its own timer sequence and
// unmounts itself via `done`, so the caller just renders <BrandIntro />.
export function BrandIntro() {
  const [iconVisible, setIconVisible] = useState(false);
  const [wordmarkVisible, setWordmarkVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const t1 = setTimeout(() => setIconVisible(true), 200);
    const t2 = setTimeout(() => setWordmarkVisible(true), 900);
    const t3 = setTimeout(() => setExiting(true), 3200);
    const t4 = setTimeout(() => {
      document.body.style.overflow = "";
      setDone(true);
    }, 3900);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      document.body.style.overflow = "";
    };
  }, []);

  if (done) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Wheewise brand intro"
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-zinc-950 transition-opacity duration-700 ease-in-out ${
        exiting ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(220,38,38,0.08) 0%, transparent 65%)",
        }}
      />
      <div className="relative z-10 flex flex-col items-center justify-center gap-6">
        <div
          className="h-36 w-36 transition-all duration-700 ease-out md:h-52 md:w-52"
          style={{
            opacity: iconVisible ? 1 : 0,
            transform: iconVisible ? "scale(1)" : "scale(0.75)",
          }}
        >
          <video
            src="/ww-motion.mp4"
            autoPlay
            muted
            loop
            playsInline
            className="h-full w-full object-contain"
          />
        </div>
        <div
          className="transition-all duration-500 ease-out"
          style={{
            opacity: wordmarkVisible ? 1 : 0,
            transform: wordmarkVisible ? "translateY(0)" : "translateY(20px)",
          }}
        >
          <Image
            src="/wheewise-wordmark.png"
            alt="Wheewise"
            width={627}
            height={98}
            className="object-contain"
            style={{ width: "clamp(140px, 24vw, 200px)", height: "auto" }}
            priority
          />
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-zinc-950 to-transparent" />
    </div>
  );
}
