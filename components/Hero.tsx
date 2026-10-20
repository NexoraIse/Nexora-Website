'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Calendar, BookOpen } from 'lucide-react';
import gsap from 'gsap';
import { AnimatePresence, motion } from 'motion/react';
import Marquee from './Marquee';
import ContourBackdrop from './ContourBackdrop';

const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$!%&';
const FINAL_TEXT = 'NEXORA';

/* ─── Hero Clouds (adapted from reference) ─── */
const HERO_CLOUDS = [
  { top: 5, w: 13, dur: 230, delay: -20 },
  { top: 10, w: 18, dur: 200, delay: -160 },
  { top: 15, w: 15, dur: 215, delay: -110 },
  { top: 12, w: 21, dur: 188, delay: -55 },
  { top: 22, w: 16, dur: 208, delay: -140 },
  { top: 26, w: 23, dur: 176, delay: -45 },
  { top: 7, w: 16, dur: 222, delay: -95 },
  { top: 18, w: 19, dur: 195, delay: -30 },
  { top: 24, w: 14, dur: 212, delay: -175 },
];
const HERO_CLOUD_DEPTHS = [0.5, 0.6, 0.52, 0.68, 0.58, 0.74, 0.55, 0.66, 0.5];

function HeroClouds() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 select-none"
      style={{
        WebkitMaskImage: 'linear-gradient(to bottom, #000 0%, #000 38%, transparent 62%)',
        maskImage: 'linear-gradient(to bottom, #000 0%, #000 38%, transparent 62%)',
      }}
    >
      {HERO_CLOUDS.map((c, i) => (
        <div
          key={i}
          className="hero-cloud absolute left-0"
          style={{
            top: `${c.top}%`,
            width: `${c.w}%`,
            aspectRatio: '220 / 90',
            animation: `hero-cloud-drift ${c.dur}s linear ${c.delay}s infinite, hero-cloud-bob ${
              9 + (i % 5) * 2
            }s ease-in-out ${-i * 1.6}s infinite`,
          }}
        >
          <svg
            viewBox="0 0 220 90"
            className="h-full w-full"
            style={{ opacity: Math.min(0.15, 0.1 * HERO_CLOUD_DEPTHS[i]), filter: 'blur(0.8px)' }}
            aria-hidden
          >
            <g fill="var(--theme-text-dark, #060a14)">
              <ellipse cx="70" cy="60" rx="70" ry="28" />
              <ellipse cx="120" cy="52" rx="55" ry="34" />
              <ellipse cx="160" cy="62" rx="52" ry="26" />
              <ellipse cx="100" cy="44" rx="34" ry="26" />
            </g>
          </svg>
        </div>
      ))}
    </div>
  );
}

/* ─── Easter Egg Flash ─── */
const REPLAY_TRIGGER_COUNT = 5;
const FLASH_VISIBLE_MS = 2400;

export default function Hero({
  introStarted,
  children,
}: {
  introStarted: boolean;
  children?: ReactNode;
}) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const heroSectionRef = useRef<HTMLElement>(null);
  const landscapeContainerRef = useRef<HTMLDivElement>(null);
  const skyRevealRef = useRef<HTMLDivElement>(null);
  const landscapeRevealRef = useRef<HTMLDivElement>(null);
  const h1Ref = useRef<HTMLHeadingElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<HTMLDivElement>(null);
  const dateRef = useRef<HTMLParagraphElement>(null);
  const clicksRef = useRef(0);
  const replayIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => {
    const scene = sceneRef.current;
    const section = heroSectionRef.current;
    const landscapeContainer = landscapeContainerRef.current;
    const skyReveal = skyRevealRef.current;
    const landscapeReveal = landscapeRevealRef.current;
    if (!scene || !section || !landscapeContainer || !skyReveal || !landscapeReveal) return;

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;

      const skyBounds = section.getBoundingClientRect();
      const landscapeBounds = landscapeContainer.getBoundingClientRect();
      skyReveal.style.setProperty('--cursor-x', `${event.clientX - skyBounds.left}px`);
      skyReveal.style.setProperty('--cursor-y', `${event.clientY - skyBounds.top}px`);
      landscapeReveal.style.setProperty('--cursor-x', `${event.clientX - landscapeBounds.left}px`);
      landscapeReveal.style.setProperty('--cursor-y', `${event.clientY - landscapeBounds.top}px`);
    };

    const hideReveal = () => {
      skyReveal.style.setProperty('--cursor-x', '-300px');
      skyReveal.style.setProperty('--cursor-y', '-300px');
      landscapeReveal.style.setProperty('--cursor-x', '-300px');
      landscapeReveal.style.setProperty('--cursor-y', '-300px');
    };

    scene.addEventListener('pointermove', onPointerMove);
    scene.addEventListener('pointerleave', hideReveal);

    return () => {
      scene.removeEventListener('pointermove', onPointerMove);
      scene.removeEventListener('pointerleave', hideReveal);
    };
  }, []);

  /* ─── Title Click Scramble Replay ─── */
  const handleTitleClick = useCallback(() => {
    const h1 = h1Ref.current;
    if (!h1) return;

    clicksRef.current += 1;

    if (replayIntervalRef.current) clearInterval(replayIntervalRef.current);
    let iteration = 0;
    const totalChars = FINAL_TEXT.length;
    replayIntervalRef.current = setInterval(() => {
      h1.innerText = FINAL_TEXT.split('').map((char, i) => {
        if (i < Math.floor(iteration)) return char;
        if (char === "'" || char === ' ') return char;
        return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
      }).join('');
      iteration += 0.5;
      if (iteration >= totalChars) {
        h1.innerText = FINAL_TEXT;
        if (replayIntervalRef.current) clearInterval(replayIntervalRef.current);
      }
    }, 30);

    if (clicksRef.current === REPLAY_TRIGGER_COUNT) {
      setFlash('Persisting code excellence. Think · Build · Innovate.');
      setTimeout(() => setFlash(null), FLASH_VISIBLE_MS);
    }
  }, []);

  /* ─── Initial GSAP Scramble Animation ─── */
  useLayoutEffect(() => {
    const h1 = h1Ref.current;
    const line = lineRef.current;
    const theme = themeRef.current;
    const date = dateRef.current;
    if (!introStarted || !h1 || !line || !theme || !date) return;

    let iteration = 0;
    const totalChars = FINAL_TEXT.length;

    const scrambleInterval = setInterval(() => {
      h1.innerText = FINAL_TEXT.split('').map((char, i) => {
        if (i < Math.floor(iteration)) return char;
        if (char === "'" || char === ' ') return char;
        return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
      }).join('');

      iteration += 0.4;

      if (iteration >= totalChars) {
        h1.innerText = FINAL_TEXT;
        clearInterval(scrambleInterval);
        gsap.fromTo(
          [line, theme],
          { y: 24, opacity: 0, filter: 'blur(6px)' },
          { y: 0, opacity: 1, filter: 'blur(0px)', duration: 0.6, ease: 'power3.out', delay: 0.1 }
        );
        gsap.fromTo(
          date,
          { y: 24, opacity: 0, filter: 'blur(6px)' },
          { y: 0, opacity: 1, filter: 'blur(0px)', duration: 0.6, ease: 'power3.out', delay: 0.3 }
        );
      }
    }, 45);

    gsap.fromTo(
      h1,
      { y: -30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out' }
    );

    return () => {
      clearInterval(scrambleInterval);
      if (replayIntervalRef.current) clearInterval(replayIntervalRef.current);
    };
  }, [introStarted]);

  return (
    <>
      <div ref={sceneRef} className="hero-scene relative">
        <svg aria-hidden className="pointer-events-none absolute h-0 w-0">
          <filter
            id="hero-landscape-palette"
            x="-2%"
            y="-2%"
            width="104%"
            height="104%"
            colorInterpolationFilters="sRGB"
          >
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values="0.2126 0.7152 0.0722 0 0 0.2126 0.7152 0.0722 0 0 0.2126 0.7152 0.0722 0 0 0 0 0 1 0"
              result="landscapeLuminance"
            />
            <feComponentTransfer in="landscapeLuminance" result="landscapeColors">
              <feFuncR type="table" tableValues="0.07 0.14 0.22 0.30 0.34 0.37 0.39 0.40 0.41" />
              <feFuncG type="table" tableValues="0.18 0.30 0.43 0.55 0.59 0.65 0.69 0.72 0.74" />
              <feFuncB type="table" tableValues="0.09 0.16 0.23 0.39 0.48 0.55 0.68 0.84 1" />
            </feComponentTransfer>
            <feMorphology in="SourceAlpha" operator="dilate" radius="1.2" result="expandedEdges" />
            <feFlood floodColor="#173a2b" result="edgeColor" />
            <feComposite in="edgeColor" in2="expandedEdges" operator="in" result="expandedOutline" />
            <feComposite in="expandedOutline" in2="SourceAlpha" operator="out" result="landscapeOutline" />
            <feMerge>
              <feMergeNode in="landscapeOutline" />
              <feMergeNode in="landscapeColors" />
            </feMerge>
          </filter>
        </svg>
      {/* ─────────────────────────────────────────────────────────────────────────────
          1. TOP HERO SECTION – PINNED STICKY AT TOP (Curtain effect matches reference)
         ───────────────────────────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-0 w-full">
        <section
          ref={heroSectionRef}
          className="home-hero-text relative isolate flex flex-col overflow-hidden bg-[var(--theme-bg-hero,#dce6ef)]"
        >
          <HeroClouds />

          <div
            ref={skyRevealRef}
            aria-hidden
            className="hero-color-reveal pointer-events-none absolute inset-0 z-0 select-none opacity-70"
          >
            {HERO_CLOUDS.map((cloud, index) => (
              <div
                key={index}
                className="hero-cloud absolute left-0"
                style={{
                  top: `${cloud.top}%`,
                  width: `${cloud.w}%`,
                  aspectRatio: '220 / 90',
                  animation: `hero-cloud-drift ${cloud.dur}s linear ${cloud.delay}s infinite, hero-cloud-bob ${
                    9 + (index % 5) * 2
                  }s ease-in-out ${-index * 1.6}s infinite`,
                }}
              >
                <svg viewBox="0 0 220 90" className="h-full w-full" aria-hidden>
                  <g fill="white">
                    <ellipse cx="70" cy="60" rx="70" ry="28" />
                    <ellipse cx="120" cy="52" rx="55" ry="34" />
                    <ellipse cx="160" cy="62" rx="52" ry="26" />
                    <ellipse cx="100" cy="44" rx="34" ry="26" />
                  </g>
                </svg>
              </div>
            ))}
          </div>

          <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 pt-6 sm:pt-10 md:pt-16 lg:pt-20">
            {/* Main Scramble Title */}
            <div className="relative z-20 pb-4 sm:pb-5 md:pb-6 mb-14 sm:mb-16 md:mb-20">
              <h1
                ref={h1Ref}
                onClick={handleTitleClick}
                data-cursor="Recompile"
                className={`hero-title font-clash font-bold leading-none text-center whitespace-nowrap
                  ${introStarted ? '' : 'opacity-0'}
                  text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl cursor-pointer select-none`}
              >
                {FINAL_TEXT}
              </h1>

              {/* Underline bar */}
              <div
                ref={lineRef}
                className="absolute left-0 right-0 bottom-0 h-1 sm:h-[5px] md:h-1.5 bg-[var(--theme-text-dark,#060a14)] opacity-0"
              />

              {/* Floating Motto Badge */}
              <div className="absolute inset-x-0 bottom-0 flex justify-center pointer-events-none">
                <div className="translate-y-1/2">
                  <div
                    ref={themeRef}
                    className="opacity-0 bg-[var(--theme-text-dark,#060a14)] px-5 sm:px-6 md:px-8 py-2 sm:py-2.5 md:py-3 shadow-xl"
                  >
                    <p
                      className="font-clash font-bold uppercase whitespace-nowrap text-[var(--theme-bg-hero,#dce6ef)] tracking-[0.2em] sm:tracking-[0.25em] md:tracking-[0.3em]
                        text-sm sm:text-base md:text-xl lg:text-2xl leading-none translate-y-[1px] ml-[0.2em] sm:ml-[0.25em] md:ml-[0.3em]"
                    >
                      Think · Build · Innovate
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Subtitle */}
            <p
              ref={dateRef}
              className="font-bold uppercase text-[var(--theme-text-dark,#060a14)] opacity-0
                tracking-[0.16em] sm:tracking-[0.2em]
                text-xs sm:text-sm md:text-base lg:text-lg font-mono text-center max-w-xl px-4"
            >
              Department of Information Science &amp; Engineering
              <span className="block text-[11px] sm:text-xs md:text-sm tracking-[0.25em] text-[var(--theme-text-dark,#060a14)]/80 mt-1 font-semibold">
                AJIET · Mangaluru
              </span>
            </p>
          </div>

          {/* Easter egg popup */}
          <AnimatePresence>
            {flash && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: -16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: -10 }}
                transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                className="fixed top-[14%] left-1/2 -translate-x-1/2 z-[999996] bg-[var(--theme-bg-main,#060913)] text-[var(--theme-primary,#00f0ff)]
                  font-clash font-bold text-base px-6 py-3.5 rounded-full border border-[var(--theme-primary,#00f0ff)]/40
                  flex items-center gap-2.5 whitespace-nowrap shadow-2xl"
              >
                <span className="text-xl">💻</span>
                {flash}
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          2. VECTOR LANDSCAPE DIVIDER (Slides UP and OVER the sticky hero on scroll)
         ───────────────────────────────────────────────────────────────────────────── */}
      <div
        ref={landscapeContainerRef}
        className="relative z-10 w-full pointer-events-none select-none shrink-0 -mt-10 sm:-mt-16 md:-mt-22 lg:-mt-28"
      >
        <Image
          src="/bg.svg"
          alt="Background landscape"
          width={11579}
          height={5496}
          fetchPriority="high"
          loading="eager"
          className="w-full h-auto block"
        />
        <div
          ref={landscapeRevealRef}
          aria-hidden
          className="hero-landscape-reveal pointer-events-none absolute inset-0 z-10 select-none opacity-70"
        >
          <Image
            src="/bg.svg"
            alt=""
            width={11579}
            height={5496}
            loading="eager"
            className="h-auto w-full block"
          />
        </div>
      </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          3. MARQUEE STRIP (Continuous forward/reverse ticker)
         ───────────────────────────────────────────────────────────────────────────── */}
      <div className="relative z-20 -mt-1 bg-[var(--theme-bg-main,#060913)] text-[var(--theme-primary,#00f0ff)] py-3.5 sm:py-4 overflow-hidden w-full">
        <Marquee />
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          4. HOMEPAGE CONTENT (With ASCII contour backdrop and authentic Nexora copy)
         ───────────────────────────────────────────────────────────────────────────── */}
      <div className="relative z-20 bg-[var(--theme-bg-main,#060913)] text-[var(--theme-bg-hero,#dce6ef)]">
        <ContourBackdrop />
        <div className="relative z-10">
          {/* Mission & Purpose Statement */}
          <section className="px-6 sm:px-10 md:px-16 lg:px-24 xl:px-32 py-20 sm:py-28 md:py-36">
            <p
              className="font-clash font-bold leading-[0.88] text-[var(--theme-bg-hero,#dce6ef)]"
              style={{ fontSize: 'clamp(2.5rem, 7vw, 6rem)' }}
            >
              Think.
              <br />
              <span className="text-[var(--theme-primary,#00f0ff)]">Build.</span>
              <br />
              Innovate.
            </p>
            <p className="mt-8 max-w-2xl font-cabinet font-medium text-[var(--theme-primary,#00f0ff)]/80 leading-relaxed text-sm sm:text-base md:text-lg">
              Nexora is the student-led technical body of the Department of Information Science &amp; Engineering
              at A J Institute of Engineering &amp; Technology, Mangaluru. From competitive programming and
              state-level hackathons to semester study repositories and project exhibitions — talent, curiosity,
              and code are our only currencies.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                href="/events"
                data-cursor="Explore"
                className="group inline-flex items-center gap-2.5 rounded-full bg-[var(--theme-primary,#00f0ff)] px-6 py-3.5 text-xs sm:text-sm font-clash font-bold uppercase tracking-[0.15em] text-[var(--theme-bg-main,#060913)] shadow-lg transition-all duration-200 hover:scale-105 hover:bg-white active:scale-95"
              >
                <Calendar className="w-4 h-4" />
                <span>Explore Events</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/learn"
                data-cursor="Learn"
                className="inline-flex items-center gap-2.5 rounded-full border border-[var(--theme-primary,#00f0ff)]/40 px-6 py-3 text-xs sm:text-sm font-clash font-bold uppercase tracking-[0.15em] text-[var(--theme-bg-hero,#dce6ef)] transition-all duration-200 hover:bg-[var(--theme-primary,#00f0ff)]/10 hover:border-[var(--theme-primary,#00f0ff)] active:scale-95"
              >
                <BookOpen className="w-4 h-4" />
                <span>Learning Hub</span>
              </Link>
            </div>
          </section>
          {children}
        </div>
      </div>
    </>
  );
}
