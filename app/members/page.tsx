'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ContourBackdrop from '@/components/ContourBackdrop';
import { MEMBERS, TeamMember } from '@/lib/data/members';

function initials(name: string) {
  return name
    .replace(/^(Dr|Mr|Mrs|Ms|Prof)\.?\s+/i, '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
}

function normalizeUrl(url: string) {
  if (!url) return '';
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  return `https://${trimmed}`;
}

function SocialIcons({ member }: { member: TeamMember }) {
  const ghUrl = normalizeUrl(member.github);
  const inUrl = normalizeUrl(member.linkedin);

  return (
    <div className="flex items-center gap-2 shrink-0">
      {ghUrl && (
        <a
          href={ghUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${member.name}'s GitHub`}
          data-cursor="GitHub"
          className="p-1.5 rounded-lg border border-white/10 bg-white/5 text-white/70 hover:text-[var(--theme-primary,#00f0ff)] hover:border-[var(--theme-primary,#00f0ff)]/50 hover:bg-[var(--theme-primary,#00f0ff)]/10 transition-colors"
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844a9.59 9.59 0 012.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
          </svg>
        </a>
      )}

      {inUrl && (
        <a
          href={inUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${member.name}'s LinkedIn`}
          data-cursor="LinkedIn"
          className="p-1.5 rounded-lg border border-white/10 bg-white/5 text-white/70 hover:text-[var(--theme-primary,#00f0ff)] hover:border-[var(--theme-primary,#00f0ff)]/50 hover:bg-[var(--theme-primary,#00f0ff)]/10 transition-colors"
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.45a1.62 1.62 0 1 0 0 3.24 1.62 1.62 0 0 0 0-3.24" />
          </svg>
        </a>
      )}
    </div>
  );
}

function StudentCard({ member }: { member: TeamMember }) {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div
      className="group relative flex flex-col overflow-hidden rounded-xl border border-[var(--theme-primary,#00f0ff)]/20 bg-[#050c0e] transition-all duration-300 hover:border-[var(--theme-primary,#00f0ff)]/60 hover:shadow-[0_0_30px_rgba(0,240,255,0.18)]"
      style={{
        boxShadow: '0 0 0 1px rgba(0, 240, 255, 0.06), 0 15px 35px rgba(0,0,0,0.5)',
      }}
    >
      {/* 1. Terminal window header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#081215] border-b border-[var(--theme-primary,#00f0ff)]/15 select-none">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#FF5F56]/85" />
          <span className="w-2 h-2 rounded-full bg-[#FFBD2E]/85" />
          <span className="w-2 h-2 rounded-full bg-[#27C93F]/85" />
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--theme-primary,#00f0ff)]/70">
          {member.tag}
        </span>
      </div>

      {/* 2. Photo container with dot-matrix halftone overlay */}
      <div className="relative w-full aspect-[4/5] overflow-hidden bg-[#0a181c]">
        {member.image && !imgFailed ? (
          <img
            src={member.image}
            alt={member.name}
            loading="lazy"
            onError={() => setImgFailed(true)}
            className="absolute inset-0 w-full h-full object-cover contrast-105 transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#061826] via-[#082030] to-[#040e14]">
            <span className="font-clash font-black text-5xl sm:text-6xl text-[var(--theme-primary,#00f0ff)]/25 tracking-widest select-none">
              {initials(member.name)}
            </span>
          </div>
        )}

        {/* Halftone dot matrix screen overlay matching reference */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-40 mix-blend-overlay"
          style={{
            backgroundImage:
              'radial-gradient(rgba(0, 240, 255, 0.45) 1px, transparent 1px)',
            backgroundSize: '3.5px 3.5px',
          }}
        />

        {/* Scanlines */}
        <div aria-hidden className="terminal-scanlines opacity-20 pointer-events-none" />

        {/* Bottom subtle gradient fade to card panel */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#050c0e] via-[#050c0e]/60 to-transparent"
        />
      </div>

      {/* 3. Bottom Info Panel (Name fully visible + GitHub and LinkedIn icons) */}
      <div className="flex items-center justify-between gap-2.5 px-3.5 sm:px-4 py-3.5 bg-[#050c0e]">
        <h3 className="font-clash font-black text-sm sm:text-base text-white leading-snug tracking-wide group-hover:text-[var(--theme-primary,#00f0ff)] transition-colors break-words">
          {member.name}
        </h3>
        <SocialIcons member={member} />
      </div>
    </div>
  );
}

export default function MembersPage() {
  const webTeamMembers = MEMBERS;

  return (
    <main className="relative min-h-screen w-full isolate bg-[var(--theme-bg-main,#060913)] text-[var(--theme-bg-hero,#dce6ef)]">
      {/* ASCII contour particle background matching reference */}
      <ContourBackdrop />

      {/* Global Navigation Bar */}
      <Navbar />

      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-28 pb-24 sm:px-6 lg:px-8">
        {/* ─────────────────────────────────────────────────────────────
            1. HERO TITLE HEADER (One line with blue Members)
           ───────────────────────────────────────────────────────────── */}
        <section className="text-center max-w-3xl mx-auto mb-16">
          <h1
            className="font-clash font-extrabold text-white tracking-tight leading-[1.05] sm:whitespace-nowrap"
            style={{ fontSize: 'clamp(1.85rem, 5.2vw, 4.2rem)' }}
          >
            Nexora Club <span className="text-[var(--theme-primary,#00f0ff)]">Members</span>
          </h1>
        </section>

        {/* ─────────────────────────────────────────────────────────────
            2. WEBSITE DEVELOPMENT TEAM SECTION
           ───────────────────────────────────────────────────────────── */}
        <div className="relative my-14 text-center">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-[var(--theme-primary,#00f0ff)]/25" />
          </div>
          <div className="relative flex flex-col items-center justify-center">
            <span className="bg-[var(--theme-bg-main,#060913)] px-6 font-mono text-sm sm:text-base uppercase tracking-[0.35em] text-[var(--theme-primary,#00f0ff)] font-bold">
              W E B S I T E &nbsp; D E V E L O P M E N T &nbsp; T E A M
            </span>
            <span className="bg-[var(--theme-bg-main,#060913)] px-4 mt-1.5 text-xs font-mono text-white/50 tracking-wider">
              Architects, designers, and engineers behind the Nexora digital ecosystem.
            </span>
          </div>
        </div>

        {/* 4-column student grid matching reference */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6">
          {webTeamMembers.map((member) => (
            <StudentCard key={member.id} member={member} />
          ))}
        </div>
      </div>

      {/* Global Footer */}
      <Footer />
    </main>
  );
}
