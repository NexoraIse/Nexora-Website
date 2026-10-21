"use client";

import React from "react";
import { Search, GraduationCap } from "./Icons";

interface LearnHeroProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectQuickFilter?: (filter: string) => void;
}

export default function LearnHero({
  searchQuery,
  onSearchChange,
  onSelectQuickFilter,
}: LearnHeroProps) {
  const quickLinks = [
    { label: "Study Materials", target: "#study-materials", filter: "notes" },
    { label: "Exam Corner", target: "#upcoming-exams", filter: "exams" },
    { label: "Skill Development", target: "#skill-development", filter: "skills" },
    { label: "Latest Updates", target: "#latest-updates", filter: "updates" },
  ];

  return (
    <section className="relative mx-auto w-full max-w-7xl px-6 sm:px-10 lg:px-12 pt-28 pb-14">
      {/* Eyebrow Label */}
      <div className="flex items-center gap-2 mb-4 font-mono text-xs uppercase tracking-[0.2em] text-[var(--theme-primary,#00f0ff)]/70">
        <GraduationCap className="w-4 h-4 text-[var(--theme-primary,#00f0ff)]" />
        <span>Department of ISE · Academic &amp; Skill Repository</span>
      </div>

      {/* Main Heading - Matches Homepage Scale & Weight */}
      <h1
        className="font-clash font-bold leading-[0.9] text-[var(--theme-bg-hero,#dce6ef)] tracking-tight"
        style={{ fontSize: "clamp(2.8rem, 6.5vw, 5.5rem)" }}
      >
        Learn Something <span className="text-[var(--theme-primary,#00f0ff)]">New</span>.
      </h1>

      {/* Subtitle */}
      <p className="mt-6 max-w-2xl font-cabinet font-medium text-white/75 leading-relaxed text-base sm:text-lg">
        Your space for academic resources, VTU question papers, exam updates, and engineering skill tracks.
      </p>

      {/* Search Input Box - Architectural, Human-Designed */}
      <div className="mt-8 max-w-2xl">
        <div className="group relative flex items-center border border-[var(--theme-primary,#00f0ff)]/30 bg-[#060a14] px-4 py-3 transition-colors focus-within:border-[var(--theme-primary,#00f0ff)]">
          <label htmlFor="learn-search" className="sr-only">
            Search notes, subjects, resources
          </label>
          <Search className="h-4 w-4 text-[var(--theme-primary,#00f0ff)]/80 shrink-0" />
          <input
            id="learn-search"
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search notes, subjects, resources, lab manuals..."
            className="ml-3 w-full bg-transparent text-sm sm:text-base text-[var(--theme-bg-hero,#dce6ef)] placeholder-white/40 focus:outline-none font-cabinet"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="text-xs font-mono text-white/40 hover:text-white px-2 py-0.5"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Quick Jump Links */}
      <div className="mt-6 flex flex-wrap items-center gap-2.5 sm:gap-3">
        <span className="font-mono text-xs uppercase tracking-wider text-white/40 mr-1">
          Jump to:
        </span>
        {quickLinks.map((link) => (
          <a
            key={link.label}
            href={link.target}
            data-cursor={link.label}
            onClick={() => onSelectQuickFilter?.(link.filter)}
            className="border border-[var(--theme-primary,#00f0ff)]/30 px-3.5 py-1.5 font-mono text-xs uppercase tracking-wider text-[var(--theme-bg-hero,#dce6ef)] transition-all hover:bg-[var(--theme-primary,#00f0ff)] hover:text-[var(--theme-bg-main,#060913)] active:scale-95"
          >
            {link.label}
          </a>
        ))}
      </div>
    </section>
  );
}
