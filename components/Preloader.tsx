"use client";

import { useEffect, useState } from "react";
import localFont from "next/font/local";

const bartle = localFont({
  src: "../public/fonts/BBHBartle-Regular.ttf",
  display: "swap",
  fallback: ["sans-serif"],
});

interface PreloaderProps {
  onFinish?: () => void;
}

export default function Preloader({ onFinish }: PreloaderProps) {
  const [complete, setComplete] = useState(false);
  const [hide, setHide] = useState(false);
  const [displayCount, setDisplayCount] = useState(0);

  const text = "NEXORA";

  useEffect(() => {
    document.body.style.overflow = "hidden";

    const duration = 1200;
    const startTime = performance.now();
    let completeTimer: number | undefined;
    let finishTimer: number | undefined;
    const interval = window.setInterval(() => {
      const progress = Math.min((performance.now() - startTime) / duration, 1);
      setDisplayCount(Math.round(progress * 100));
      if (progress < 1) return;

      window.clearInterval(interval);
      completeTimer = window.setTimeout(() => {
        setComplete(true);
        finishTimer = window.setTimeout(() => {
          document.body.style.overflow = "";
          setHide(true);
          onFinish?.();
        }, 700);
      }, 250);
    }, 50);

    return () => {
      window.clearInterval(interval);
      if (completeTimer) window.clearTimeout(completeTimer);
      if (finishTimer) window.clearTimeout(finishTimer);
      document.body.style.overflow = "";
    };
  }, [onFinish]);

  if (hide) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-black text-white transition-all duration-700 ease-[cubic-bezier(0.76,0,0.24,1)] select-none ${
        complete ? "-translate-y-full rounded-b-[50%]" : "translate-y-0 rounded-b-none"
      }`}
    >
      {/* Smooth Progress Bar at Top */}
      <div
        className="absolute top-0 left-0 h-1 bg-white transition-all duration-50 ease-linear"
        style={{ width: `${displayCount}%` }}
      />

      {/* Lit Characters Animation */}
      <div className={`flex tracking-wider sm:tracking-widest ${bartle.className}`}>
        {text.split("").map((char, index) => {
          const threshold = (index / text.length) * 100;
          const isLit = displayCount > threshold;

          return (
            <span
              key={index}
              className={`text-[10vw] sm:text-[7.5vw] font-bold leading-none inline-block transition-all duration-300 ${
                isLit
                  ? "text-white opacity-100 drop-shadow-[0_0_12px_rgba(255,255,255,0.9)] animate-glitch"
                  : "text-gray-800 opacity-20 blur-[1px]"
              }`}
              style={{
                minWidth: char === " " ? "1.5vw" : "auto",
              }}
            >
              {char}
            </span>
          );
        })}
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes glitch {
          0% { transform: translate(0); opacity: 1; }
          2% { transform: translate(-2px, 2px); opacity: 0.8; }
          4% { transform: translate(2px, -2px); opacity: 1; }
          6% { transform: translate(0); opacity: 1; }
          8% { transform: translate(0); opacity: 0.5; }
          10% { transform: translate(0); opacity: 1; }
          12% { transform: translate(-2px, 0); opacity: 0.8; }
          14% { transform: translate(0); opacity: 1; }
          50% { transform: translate(1px, 1px); opacity: 0.9; }
          100% { transform: translate(0); opacity: 1; }
        }
        .animate-glitch {
          animation: glitch 0.4s infinite cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
      `}} />
    </div>
  );
}
