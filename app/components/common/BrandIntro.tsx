"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

// Shows on every page load, no exceptions — no storage check, no "seen
// before" tracking. Fully self-contained: runs its own timer sequence and
// unmounts itself via `done`, so the caller just renders <BrandIntro />.
export function BrandIntro() {
  const [iconVisible, setIconVisible] = useState(false);
  const [wordmarkVisible, setWordmarkVisible] = useState(false);
  const [taglineVisible, setTaglineVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const t1 = setTimeout(() => setIconVisible(true), 200);
    const t2 = setTimeout(() => setWordmarkVisible(true), 900);
    const t3 = setTimeout(() => setTaglineVisible(true), 1300);
    const t4 = setTimeout(() => setExiting(true), 3500);
    const t5 = setTimeout(() => {
      document.body.style.overflow = "";
      setDone(true);
    }, 4200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
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
            "radial-gradient(ellipse at center, rgba(220,38,38,0.1) 0%, transparent 60%)",
        }}
      />
      {/* Deliberately no position/z-index here (was `relative z-10`): that
          creates a new stacking context, which isolates the video's
          mix-blend-mode below from ever reaching the glow/background layers
          above — it'd blend against nothing and just show as a solid box.
          DOM order alone (this comes after the absolutely-positioned glow
          div) already paints it on top without needing z-index. */}
      <div className="flex flex-col items-center justify-center gap-4">
        {/* Motion mark — video has a black background baked into the
            footage, so mixBlendMode "screen" correctly keys it out against
            this dark backdrop (black is the identity for screen blend). */}
        <div
          className="h-36 w-36 transition-all duration-700 ease-out md:h-44 md:w-44"
          style={{
            opacity: iconVisible ? 1 : 0,
            transform: iconVisible ? "scale(1)" : "scale(0.7)",
            mixBlendMode: "screen",
          }}
        >
          <video
            src="/ww-motion.mp4"
            autoPlay
            muted
            loop
            playsInline
            className="h-full w-full object-contain"
            style={{ mixBlendMode: "screen" }}
          />
        </div>

        {/* Wordmark — already has real alpha transparency (trimmed/keyed
            out with sharp), renders correctly plain. No blend-mode/filter
            treatment here: that trick is for non-transparent assets and
            would wash out the actual logo colors on this one. */}
        <div
          className="transition-all duration-500 ease-out"
          style={{
            opacity: wordmarkVisible ? 1 : 0,
            transform: wordmarkVisible ? "translateY(0)" : "translateY(16px)",
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

        {/* Tagline */}
        <p
          className="text-center text-sm font-light tracking-[0.25em] text-zinc-400 uppercase transition-all duration-500 ease-out"
          style={{
            opacity: taglineVisible ? 1 : 0,
            transform: taglineVisible ? "translateY(0)" : "translateY(12px)",
          }}
        >
          Where Smart Wheels Begin
        </p>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-zinc-950 to-transparent" />
    </div>
  );
}
