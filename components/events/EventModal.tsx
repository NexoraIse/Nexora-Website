'use client';

import React, { useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  X,
  Calendar,
  MapPin,
  Users,
  Shield,
  Tag,
  Clock,
  UserCheck,
  Sparkles,
} from 'lucide-react';
import { EventItem } from '@/lib/types';

interface EventModalProps {
  event: EventItem | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenRegister: (event: EventItem) => void;
}

export default function EventModal({
  event,
  isOpen,
  onClose,
  onOpenRegister,
}: EventModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Keyboard accessibility: Escape key listener and body scroll lock
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    // Lock body scroll
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    window.addEventListener('keydown', handleKeyDown);

    // Focus close button or container
    modalRef.current?.focus();

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !event) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Content */}
      <div
        ref={modalRef}
        tabIndex={-1}
        className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-sky-400/40 bg-slate-950 p-0 text-white shadow-[0_0_50px_rgba(56,189,248,0.3)] transition-all transform duration-300 z-10 my-8 focus:outline-none"
      >
        {/* Cover image header */}
        <div className="relative h-60 sm:h-72 w-full bg-slate-900">
          <Image
            src={event.imageUrl}
            alt={`${event.title} banner`}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close event details modal"
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-sky-400/30 bg-slate-950/80 text-sky-300 backdrop-blur-md transition-colors hover:border-sky-400 hover:bg-sky-400/20 hover:text-white cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Category & Status Overlay */}
          <div className="absolute bottom-4 left-6 right-6 flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-400/50 bg-slate-950/90 px-3.5 py-1 text-xs font-semibold text-sky-300 shadow-[0_0_15px_rgba(56,189,248,0.25)]">
              <Tag className="h-3.5 w-3.5 text-sky-400" />
              <span>{event.category}</span>
            </span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[calc(85vh-240px)] overflow-y-auto scrollbar-thin scrollbar-thumb-sky-500/20">
          <div>
            <h2 id="modal-title" className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {event.title}
            </h2>
            <p className="mt-3 text-sm sm:text-base leading-relaxed text-sky-100/80">
              {event.fullDescription}
            </p>
          </div>

          {/* Event Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-2xl border border-sky-500/20 bg-sky-950/20 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-sky-400/30 bg-sky-400/10 text-sky-400">
                <Calendar className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-medium text-sky-200/50 uppercase tracking-wider">Date</p>
                <p className="text-sm font-semibold text-white mt-0.5">{event.dateDisplay}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-sky-400/30 bg-sky-400/10 text-sky-400">
                <MapPin className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-medium text-sky-200/50 uppercase tracking-wider">Venue</p>
                <p className="text-sm font-semibold text-white mt-0.5">{event.venueDisplay}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-sky-400/30 bg-sky-400/10 text-sky-400">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-medium text-sky-200/50 uppercase tracking-wider">Eligibility</p>
                <p className="text-sm text-white/90 mt-0.5">{event.eligibility}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-sky-400/30 bg-sky-400/10 text-sky-400">
                <Shield className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-medium text-sky-200/50 uppercase tracking-wider">Organized By</p>
                <p className="text-sm text-white/90 mt-0.5">{event.organizer}</p>
              </div>
            </div>
          </div>

          {/* Tags */}
          {event.tags && event.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <span className="text-xs text-sky-200/60 font-medium">Focus Topics:</span>
              {event.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-lg border border-sky-500/20 bg-slate-900/60 px-2.5 py-1 text-xs text-sky-300"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Registration Status note */}
          <div className="rounded-xl border border-sky-400/20 bg-sky-950/30 p-3.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-sky-300">
              <Clock className="h-4 w-4 text-sky-400" />
              <span>Status: <strong className="text-emerald-400">Registrations Open</strong></span>
            </div>
            <span className="text-sky-200/60">Official schedule TBA</span>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-sky-500/20 bg-slate-950/80 p-5 sm:p-6 backdrop-blur-md">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-sky-400/30 bg-slate-900 px-5 py-2.5 text-sm font-semibold text-sky-200 hover:border-sky-400 hover:bg-sky-400/10 hover:text-white transition-all cursor-pointer"
          >
            Close
          </button>

          {event.registrationOpen && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenRegister(event);
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-sky-300/50 bg-gradient-to-r from-sky-500 to-cyan-500 px-6 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_0_20px_rgba(56,189,248,0.4)] hover:from-sky-400 hover:to-cyan-400 hover:shadow-[0_0_30px_rgba(56,189,248,0.6)] transition-all cursor-pointer"
            >
              <UserCheck className="h-4 w-4" />
              <span>Register Now</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
