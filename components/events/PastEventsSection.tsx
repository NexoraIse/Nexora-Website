import React from 'react';
import { Camera, Clock, History, Sparkles } from 'lucide-react';

export default function PastEventsSection() {
  return (
    <section id="past-events" className="relative w-full py-20 overflow-hidden">
      {/* Background accents */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-10 -translate-x-1/2 -z-10 h-64 w-96 rounded-full bg-sky-500/10 blur-[120px]"
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-950/40 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-sky-400 backdrop-blur-md">
            <History className="h-3.5 w-3.5" />
            <span>Retrospective Archives</span>
          </div>

          <h2 className="mt-4 text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white">
            Moments That Made Us.
          </h2>

          <p className="mt-3 text-base sm:text-lg text-sky-100/70 leading-relaxed">
            Discover the events, experiences, and achievements that bring our department community together.
          </p>
        </div>

        {/* Empty State / Coming Soon Retrospective Showcase */}
        <div className="mt-12 mx-auto max-w-3xl rounded-3xl border border-sky-500/25 bg-slate-950/70 p-8 sm:p-12 text-center backdrop-blur-md shadow-[0_0_35px_rgba(56,189,248,0.15)] relative overflow-hidden">
          {/* Subtle neon circuit background lines */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-950/30 via-slate-950/0 to-slate-950/0 pointer-events-none"
          />

          <div className="relative z-10 flex flex-col items-center">
            {/* Glowing Icon Container */}
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-sky-400/40 bg-gradient-to-br from-sky-400/20 to-blue-600/10 text-sky-300 shadow-[0_0_25px_rgba(56,189,248,0.3)]">
              <Camera className="h-8 w-8 text-sky-400" />
            </div>

            <h3 className="mt-5 text-xl sm:text-2xl font-bold text-white tracking-tight">
              Past Highlights Archive In Progress
            </h3>

            <p className="mt-3 max-w-xl text-sm sm:text-base text-sky-100/70 leading-relaxed">
              The Nexora ISE Club is actively gathering gallery photographs, winner chronicles, and verified retrospective highlights from our past departmental symposiums and technical meetups. 
            </p>

            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-500/10 px-4 py-1.5 text-xs font-medium text-sky-300">
              <Clock className="h-3.5 w-3.5" />
              <span>Historical photo galleries &amp; recap reels launching soon</span>
            </div>

            {/* Feature preview cards */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full text-left">
              <div className="rounded-2xl border border-sky-500/20 bg-slate-900/50 p-4">
                <Sparkles className="h-4 w-4 text-sky-400 mb-2" />
                <p className="text-xs font-semibold text-white">Event Spotlights</p>
                <p className="text-[11px] text-sky-200/60 mt-1">Key moments &amp; keynote lectures from earlier seasons.</p>
              </div>

              <div className="rounded-2xl border border-sky-500/20 bg-slate-900/50 p-4">
                <History className="h-4 w-4 text-cyan-400 mb-2" />
                <p className="text-xs font-semibold text-white">Winners Hall</p>
                <p className="text-[11px] text-sky-200/60 mt-1">Celebrating our student champions and innovation prize holders.</p>
              </div>

              <div className="rounded-2xl border border-sky-500/20 bg-slate-900/50 p-4">
                <Camera className="h-4 w-4 text-indigo-400 mb-2" />
                <p className="text-xs font-semibold text-white">Campus Gallery</p>
                <p className="text-[11px] text-sky-200/60 mt-1">Behind-the-scenes snapshots of student teamwork.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
