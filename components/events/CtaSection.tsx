'use client';

import React from 'react';
import { ArrowUp, Sparkles, Terminal } from 'lucide-react';

export default function CtaSection() {
  const scrollToGrid = () => {
    const el = document.getElementById('events-grid');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative w-full py-20 px-4 sm:px-6 lg:px-8">
      <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl border border-sky-400/35 bg-gradient-to-br from-slate-950 via-sky-950/40 to-slate-950 p-8 sm:p-14 text-center backdrop-blur-md shadow-[0_0_40px_rgba(56,189,248,0.2)]">
        {/* Glowing Orbs in background */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -z-10 h-56 w-56 rounded-full bg-sky-500/20 blur-[100px]"
        />

        <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-950/60 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-sky-400 backdrop-blur-sm">
          <Terminal className="h-3.5 w-3.5" />
          <span>JOIN THE NEXORA COMMUNITY</span>
        </div>

        <h2 className="mt-5 text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
          Be Part of What&apos;s Next.
        </h2>

        <p className="mt-4 max-w-xl mx-auto text-base sm:text-lg text-sky-100/75 leading-relaxed">
          Bring your curiosity, share your ideas, and build something meaningful with the Nexora community.
        </p>

        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={scrollToGrid}
            className="group inline-flex items-center gap-2.5 rounded-full border border-sky-300/60 bg-gradient-to-r from-sky-500 to-cyan-500 px-8 py-3.5 text-sm font-semibold text-slate-950 shadow-[0_0_25px_rgba(56,189,248,0.5)] transition-all duration-300 hover:from-sky-400 hover:to-cyan-400 hover:shadow-[0_0_35px_rgba(56,189,248,0.7)] hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            <Sparkles className="h-4 w-4 fill-slate-950" />
            <span>Explore Events</span>
            <ArrowUp className="h-4 w-4 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </section>
  );
}
