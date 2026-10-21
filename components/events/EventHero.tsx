'use client';

import React from 'react';
import { ArrowDown, Sparkles, Terminal } from 'lucide-react';

export default function EventHero() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="home" className="relative w-full pt-32 pb-16 sm:pt-40 sm:pb-24 overflow-hidden">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        {/* Eyebrow badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--theme-primary,#00f0ff)]/40 bg-[var(--theme-primary,#00f0ff)]/10 px-4 py-1.5 backdrop-blur-md shadow-[0_0_15px_rgba(0, 240, 255,0.2)]">
          <Terminal className="h-3.5 w-3.5 text-[var(--theme-primary,#00f0ff)] animate-pulse" />
          <span className="font-terminal text-xs tracking-[0.2em] uppercase text-[var(--theme-primary,#00f0ff)]">
            NEXORA | INFORMATION SCIENCE &amp; ENGINEERING
          </span>
        </div>

        {/* Main Heading */}
        <h1 className="mt-8 text-4xl sm:text-6xl md:text-7xl font-clash font-bold tracking-tight text-[var(--theme-bg-hero,#dce6ef)] leading-[1.1] max-w-4xl mx-auto">
          <span className="block">
            Where Ideas Become
          </span>
          <span className="mt-2 block text-[var(--theme-primary,#00f0ff)]">
            Innovation.
          </span>
        </h1>

        {/* Supporting Text */}
        <p className="mt-6 max-w-2xl mx-auto text-base sm:text-lg md:text-xl text-[var(--theme-primary,#00f0ff)]/80 leading-relaxed font-cabinet">
          Explore the events, workshops, hackathons, and competitions that bring technology, creativity, and collaboration together.
        </p>

        {/* Action Buttons */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4 sm:gap-5">
          <button
            type="button"
            onClick={() => scrollToSection('events-grid')}
            data-cursor="Explore"
            className="group relative inline-flex items-center justify-center gap-2.5 rounded-full border border-[var(--theme-primary,#00f0ff)] bg-[var(--theme-primary,#00f0ff)] px-7 py-3.5 text-sm font-clash font-bold uppercase tracking-wider text-[var(--theme-bg-main,#060913)] transition-all duration-300 hover:bg-[var(--theme-bg-hero,#dce6ef)] hover:shadow-[0_0_30px_rgba(0, 240, 255,0.5)] hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            <Sparkles className="h-4 w-4 fill-[var(--theme-bg-main,#060913)] text-[var(--theme-bg-main,#060913)] group-hover:rotate-12 transition-transform duration-300" />
            <span>Explore Events</span>
            <ArrowDown className="h-4 w-4 group-hover:translate-y-0.5 transition-transform duration-300" />
          </button>
        </div>
      </div>
    </section>
  );
}
