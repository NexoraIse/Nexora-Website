'use client';

import React from 'react';
import Image from 'next/image';
import {
  Code,
  Cpu,
  BrainCircuit,
  Globe,
  ShieldCheck,
  Lightbulb,
  Calendar,
  MapPin,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { EventItem } from '@/lib/types';

interface EventCardProps {
  event: EventItem;
  onViewDetails: (event: EventItem) => void;
  onRegister: (event: EventItem) => void;
}

const ICON_MAP = {
  Code: Code,
  Cpu: Cpu,
  BrainCircuit: BrainCircuit,
  Globe: Globe,
  ShieldCheck: ShieldCheck,
  Lightbulb: Lightbulb,
};

export default function EventCard({ event, onViewDetails, onRegister }: EventCardProps) {
  const IconComponent = ICON_MAP[event.iconName] || Code;

  return (
    <div
      className="group relative flex flex-col h-full overflow-hidden rounded-xl border border-[var(--theme-primary,#00f0ff)]/25 bg-[#03080a] isolate transition-all duration-300 hover:border-[var(--theme-primary,#00f0ff)]/60 hover:-translate-y-1.5"
      style={{
        boxShadow:
          '0 0 0 1px rgba(0, 240, 255,0.1), 0 24px 60px rgba(0,0,0,0.45), 0 0 40px rgba(0, 240, 255,0.08)',
      }}
    >
      {/* Terminal window header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#080f09] border-b border-[var(--theme-primary,#00f0ff)]/10 select-none">
        <div className="flex items-center gap-1.5">
          <span className="w-[7px] h-[7px] rounded-full bg-[#FF5F56]/70" />
          <span className="w-[7px] h-[7px] rounded-full bg-[#FFBD2E]/70" />
          <span className="w-[7px] h-[7px] rounded-full bg-[#27C93F]/70" />
        </div>
        <span className="font-terminal text-[9px] uppercase tracking-[0.2em] text-[var(--theme-primary,#00f0ff)]/60">
          {event.category}
        </span>
      </div>

      {/* Event Cover Image Container */}
      <div className="relative h-48 w-full overflow-hidden bg-[#080f09]">
        <Image
          src={event.imageUrl}
          alt={`${event.title} cover image`}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />

        <div aria-hidden className="terminal-scanlines opacity-30" />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#03080a] via-transparent to-transparent" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-2">
          {event.registrationOpen ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--theme-primary,#00f0ff)] px-2.5 py-0.5 text-[10px] font-clash font-bold uppercase tracking-wider text-[var(--theme-bg-main,#060913)] shadow-md">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--theme-bg-main,#060913)] animate-pulse" />
              Open
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-black/60 px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-wider text-white/70 backdrop-blur-md">
              Completed
            </span>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[var(--theme-primary,#00f0ff)]/70">
            <IconComponent className="h-3.5 w-3.5" />
            <span>{event.organizer}</span>
          </div>

          <h3 className="mt-2 text-xl font-clash font-bold leading-tight text-[var(--theme-bg-hero,#dce6ef)] group-hover:text-white transition-colors">
            {event.title}
          </h3>

          <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-white/70 line-clamp-2 font-cabinet">
            {event.description}
          </p>

          <div className="mt-4 flex flex-col gap-1.5 pt-3 border-t border-[var(--theme-primary,#00f0ff)]/10 text-xs text-[var(--theme-primary,#00f0ff)]/70 font-mono">
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{event.dateDisplay}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{event.venueDisplay}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 flex items-center gap-3 pt-3 border-t border-[var(--theme-primary,#00f0ff)]/10">
          <button
            type="button"
            onClick={() => onViewDetails(event)}
            data-cursor="Details"
            className="flex-1 rounded-full border border-[var(--theme-primary,#00f0ff)]/30 bg-[var(--theme-primary,#00f0ff)]/10 py-2.5 text-xs font-clash font-bold uppercase tracking-wider text-[var(--theme-bg-hero,#dce6ef)] transition-all hover:bg-[var(--theme-primary,#00f0ff)] hover:text-[var(--theme-bg-main,#060913)] cursor-pointer"
          >
            Details
          </button>

          {event.registrationOpen && (
            <button
              type="button"
              onClick={() => onRegister(event)}
              data-cursor="Register"
              className="flex-1 rounded-full bg-[var(--theme-primary,#00f0ff)] py-2.5 text-xs font-clash font-bold uppercase tracking-wider text-[var(--theme-bg-main,#060913)] shadow-md transition-all hover:bg-[var(--theme-bg-hero,#dce6ef)] cursor-pointer"
            >
              Register
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
