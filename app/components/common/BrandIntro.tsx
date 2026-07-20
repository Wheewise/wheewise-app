"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

const PARTICLES: Array<{
  x: string;
  y: string;
  size: number;
  delay: number;
  dur: number;
}> = [
  { x: "72%", y: "38%", size: 2.5, delay: 0.15, dur: 3.6 },
  { x: "66%", y: "54%", size: 1.5, delay: 0.5, dur: 4.2 },
  { x: "81%", y: "44%", size: 3, delay: 0.1, dur: 3.1 },
  { x: "59%", y: "32%", size: 2, delay: 0.75, dur: 4.6 },
  { x: "76%", y: "62%", size: 1.5, delay: 0.35, dur: 3.9 },
  { x: "87%", y: "41%", size: 2.5, delay: 0.6, dur: 3.3 },
  { x: "63%", y: "67%", size: 1, delay: 0.9, dur: 4.3 },
  { x: "79%", y: "27%", size: 2, delay: 0.45, dur: 3.7 },
  { x: "91%", y: "55%", size: 1.5, delay: 0.2, dur: 4 },
  { x: "69%", y: "48%", size: 1, delay: 0.8, dur: 3.4 },
];

// ── useSyncExternalStore wiring ───────────────────────────────────────────
// Reads the localStorage flag at render time (no setState in useEffect).
// getServerSnapshot returns true so SSR always renders null; React
// reconciles to the real snapshot after hydration.
const subscribeNoop = (_cb: () => void) => () => {};
const getIntroFlagSnapshot = () => !!localStorage.getItem("wheewise_intro_seen");
const getIntroFlagServerSnapshot = () => true;

export function BrandIntro() {
  // alreadySeen: true on the server and on return visits; false on first visit.
  const alreadySeen = useSyncExternalStore(
    subscribeNoop,
    getIntroFlagSnapshot,
    getIntroFlagServerSnapshot,
  );

  // dismissed tracks whether the intro has finished playing this session.
  const [dismissed, setDismissed] = useState(false);
  const [exiting, setExiting] = useState(false);
  const dismissingRef = useRef(false);

  // useCallback gives dismiss a stable identity so the useEffect dep array
  // can include it without causing the effect to re-run unnecessarily.
  const dismiss = useCallback(() => {
    if (dismissingRef.current) return;
    dismissingRef.current = true;
    setExiting(true);
    // setState calls are inside a setTimeout callback — not at the top level
    // of a useEffect — so they satisfy react-hooks/set-state-in-effect.
    setTimeout(() => {
      localStorage.setItem("wheewise_intro_seen", "1");
      document.body.style.overflow = "";
      setDismissed(true);
    }, 820);
  }, []); // stable: only closes over refs and setState setters

  useEffect(() => {
    if (alreadySeen) return;
    document.body.style.overflow = "hidden";
    const autoExit = setTimeout(dismiss, 5600);
    return () => {
      clearTimeout(autoExit);
      document.body.style.overflow = "";
    };
  }, [alreadySeen, dismiss]);

  if (alreadySeen || dismissed) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Wheewise brand intro"
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
      style={{
        backgroundColor: "#0a0a0a",
        animation: exiting ? "ww-intro-exit 0.82s cubic-bezier(0.4,0,0.2,1) forwards" : undefined,
      }}
    >
      {/* ── Right-side ambient red glow ─────────────────────────── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 80% at 95% 50%, rgba(220,38,38,0.22) 0%, rgba(185,28,28,0.10) 45%, transparent 72%)",
          animation: "ww-glow-emerge 1.6s ease-out forwards",
          opacity: 0,
        }}
      />

      {/* ── Subtle secondary glow — upper right ─────────────────── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 40% 40% at 88% 22%, rgba(220,38,38,0.12) 0%, transparent 65%)",
          animation: "ww-glow-emerge 2s ease-out 0.4s forwards",
          opacity: 0,
        }}
      />

      {/* ── Light streaks ────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-0"
        style={{
          top: "43%",
          width: "52vw",
          height: "1px",
          transformOrigin: "right center",
          background:
            "linear-gradient(to left, rgba(220,38,38,0.65), rgba(220,38,38,0.12) 60%, transparent)",
          animation: "ww-streak-in 1.3s cubic-bezier(0.25,0.46,0.45,0.94) 0.25s forwards",
          opacity: 0,
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-0"
        style={{
          top: "51%",
          width: "34vw",
          height: "1px",
          transformOrigin: "right center",
          background:
            "linear-gradient(to left, rgba(220,38,38,0.38), rgba(220,38,38,0.06) 55%, transparent)",
          animation: "ww-streak-in 1.5s cubic-bezier(0.25,0.46,0.45,0.94) 0.48s forwards",
          opacity: 0,
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-0"
        style={{
          top: "47%",
          width: "22vw",
          height: "1px",
          transformOrigin: "right center",
          background: "linear-gradient(to left, rgba(220,38,38,0.2), transparent)",
          animation: "ww-streak-in 1.2s cubic-bezier(0.25,0.46,0.45,0.94) 0.7s forwards",
          opacity: 0,
        }}
      />

      {/* ── Floating particles ───────────────────────────────────── */}
      {PARTICLES.map((p, i) => (
        <div
          key={i}
          aria-hidden="true"
          className="pointer-events-none absolute rounded-full"
          style={{
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            backgroundColor: "#dc2626",
            boxShadow: `0 0 ${p.size * 3}px rgba(220,38,38,0.9)`,
            animation: `ww-particle-drift ${p.dur}s ease-in-out ${p.delay}s forwards`,
            opacity: 0,
          }}
        />
      ))}

      {/* ── Centre content ───────────────────────────────────────── */}
      <div className="relative flex flex-col items-center gap-5 px-6 text-center">
        {/* Motion mark */}
        <div
          className="h-36 w-36 md:h-52 md:w-52"
          style={{
            animation: "ww-logo-appear 1.3s cubic-bezier(0.16,1,0.3,1) 1.4s forwards",
            opacity: 0,
            filter:
              "drop-shadow(0 0 32px rgba(220,38,38,0.40)) drop-shadow(0 0 10px rgba(220,38,38,0.22))",
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

        {/* Wordmark */}
        <div
          style={{
            animation: "ww-brand-text 1s cubic-bezier(0.16,1,0.3,1) 3s forwards",
            opacity: 0,
          }}
        >
          <Image
            src="/wheewise-wordmark.png"
            alt="Wheewise"
            width={627}
            height={98}
            priority
            style={{
              width: "clamp(140px, 24vw, 200px)",
              height: "auto",
              objectFit: "contain",
            }}
          />
        </div>

        {/* Thin separator */}
        <div
          aria-hidden="true"
          style={{
            width: 48,
            height: 1,
            background:
              "linear-gradient(to right, transparent, rgba(220,38,38,0.7), transparent)",
            animation: "ww-glow-emerge 0.8s ease-out 3.6s forwards",
            opacity: 0,
          }}
        />

        {/* Tagline */}
        <p
          style={{
            fontFamily: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
            fontSize: "clamp(0.75rem, 1.8vw, 0.9rem)",
            fontWeight: 400,
            color: "rgba(161,161,170,1)",
            letterSpacing: "0.06em",
            maxWidth: "min(440px, 88vw)",
            lineHeight: 1.55,
            animation: "ww-fade-up 1.1s cubic-bezier(0.16,1,0.3,1) 4.1s forwards",
            opacity: 0,
          }}
        >
          Your Digital Showroom for Smarter Vehicle Sales
        </p>
      </div>

      {/* ── Skip button ──────────────────────────────────────────── */}
      <button
        onClick={dismiss}
        className="absolute top-5 right-5 sm:top-6 sm:right-7 cursor-pointer text-zinc-600 transition-colors duration-200 hover:text-zinc-300"
        style={{
          fontFamily: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
          fontSize: "0.65rem",
          fontWeight: 500,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          background: "none",
          border: "none",
          padding: "8px 12px",
          animation: "ww-fade-up 0.7s ease-out 1.2s forwards",
          opacity: 0,
        }}
        aria-label="Skip intro"
      >
        Skip ›
      </button>
    </div>
  );
}
