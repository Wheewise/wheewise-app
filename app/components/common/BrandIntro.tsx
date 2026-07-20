"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

// Shows on every page load, no exceptions — no storage check, no "seen
// before" tracking. Fully self-contained: runs its own timer sequence and
// unmounts itself via `done`, so the caller just renders <BrandIntro />.
export function BrandIntro() {
  const [phase, setPhase] = useState(0);
  const [exiting, setExiting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const t1 = setTimeout(() => setPhase(1), 100);
    const t2 = setTimeout(() => setPhase(2), 700);
    const t3 = setTimeout(() => setPhase(3), 1100);
    const t4 = setTimeout(() => setExiting(true), 3200);
    const t5 = setTimeout(() => {
      document.body.style.overflow = "";
      setDone(true);
    }, 3900);
    return () => {
      [t1, t2, t3, t4, t5].forEach(clearTimeout);
      document.body.style.overflow = "";
    };
  }, []);

  if (done) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Wheewise brand intro"
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-zinc-950 transition-opacity duration-700 ease-in-out ${
        exiting ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      {/* Animated background rings */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <div
          className="absolute h-[600px] w-[600px] rounded-full"
          style={{
            border: "1px solid rgba(220,38,38,0.08)",
            opacity: phase >= 1 ? 1 : 0,
            transform: phase >= 1 ? "scale(1)" : "scale(0.5)",
            transition: "all 1200ms ease-out",
          }}
        />
        <div
          className="absolute h-[400px] w-[400px] rounded-full"
          style={{
            border: "1px solid rgba(220,38,38,0.12)",
            opacity: phase >= 1 ? 1 : 0,
            transform: phase >= 1 ? "scale(1)" : "scale(0.5)",
            transition: "all 1000ms ease-out 150ms",
          }}
        />
        <div
          className="absolute h-[240px] w-[240px] rounded-full"
          style={{
            border: "1px solid rgba(220,38,38,0.18)",
            opacity: phase >= 1 ? 1 : 0,
            transform: phase >= 1 ? "scale(1)" : "scale(0.5)",
            transition: "all 800ms ease-out 300ms",
          }}
        />
        <div
          className="absolute h-[300px] w-[300px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(220,38,38,0.15) 0%, transparent 70%)",
            opacity: phase >= 1 ? 1 : 0,
            transform: phase >= 1 ? "scale(1)" : "scale(0.3)",
            transition: "all 1000ms ease-out",
          }}
        />
      </div>

      {/* Horizontal light line */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-1/2 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(220,38,38,0.15) 20%, rgba(220,38,38,0.3) 50%, rgba(220,38,38,0.15) 80%, transparent 100%)",
          opacity: phase >= 2 ? 1 : 0,
          transition: "opacity 800ms ease-out",
        }}
      />

      {/* Corner accents */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-8 left-8 h-10 w-10"
        style={{
          borderTop: "1px solid rgba(220,38,38,0.3)",
          borderLeft: "1px solid rgba(220,38,38,0.3)",
          opacity: phase >= 2 ? 1 : 0,
          transition: "opacity 600ms ease-out 400ms",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-8 right-8 h-10 w-10"
        style={{
          borderTop: "1px solid rgba(220,38,38,0.3)",
          borderRight: "1px solid rgba(220,38,38,0.3)",
          opacity: phase >= 2 ? 1 : 0,
          transition: "opacity 600ms ease-out 400ms",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-8 left-8 h-10 w-10"
        style={{
          borderBottom: "1px solid rgba(220,38,38,0.3)",
          borderLeft: "1px solid rgba(220,38,38,0.3)",
          opacity: phase >= 2 ? 1 : 0,
          transition: "opacity 600ms ease-out 400ms",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-8 bottom-8 h-10 w-10"
        style={{
          borderBottom: "1px solid rgba(220,38,38,0.3)",
          borderRight: "1px solid rgba(220,38,38,0.3)",
          opacity: phase >= 2 ? 1 : 0,
          transition: "opacity 600ms ease-out 400ms",
        }}
      />

      {/* Main content. Deliberately no position/z-index here (a prior
          `relative z-10` created a stacking context that isolated the
          video's mix-blend-mode from the layers behind it, making it
          render as a solid black box instead of blending — see the fix
          two commits back). DOM order alone already paints this above the
          absolutely-positioned rings/lines/corners, no z-index needed. */}
      <div className="flex flex-col items-center justify-center gap-2">
        {/* Motion mark — video has a black background baked into the
            footage, so mixBlendMode "screen" correctly keys it out against
            this dark backdrop (black is the identity for screen blend). */}
        <div
          className="h-40 w-40"
          style={{
            opacity: phase >= 1 ? 1 : 0,
            transform: phase >= 1 ? "scale(1) translateY(0)" : "scale(0.6) translateY(20px)",
            transition: "all 700ms cubic-bezier(0.34, 1.56, 0.64, 1)",
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
          className="-mt-2"
          style={{
            opacity: phase >= 2 ? 1 : 0,
            transform: phase >= 2 ? "translateY(0)" : "translateY(12px)",
            transition: "all 600ms ease-out",
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
          className="mt-1 text-center text-[11px] font-light tracking-[0.25em] text-zinc-400 uppercase"
          style={{
            opacity: phase >= 3 ? 1 : 0,
            transform: phase >= 3 ? "translateY(0)" : "translateY(8px)",
            transition: "all 500ms ease-out",
          }}
        >
          Where Smart Wheels Begin
        </p>
      </div>

      {/* Bottom fade */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-zinc-950 to-transparent" />
    </div>
  );
}
