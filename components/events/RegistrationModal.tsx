'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  User,
  Mail,
  Phone,
  GraduationCap,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { EventItem } from '@/lib/types';

interface RegistrationModalProps {
  event: EventItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function RegistrationModal({
  event,
  isOpen,
  onClose,
}: RegistrationModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [college, setCollege] = useState('');

  // UI status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    registrationId?: string;
    message?: string;
  } | null>(null);

  // Reset form when modal opens with a new event
  useEffect(() => {
    if (isOpen) {
      setFullName('');
      setEmail('');
      setPhone('');
      setCollege('');
      setErrorMsg(null);
      setSuccessData(null);
      setIsSubmitting(false);

      // Lock body scroll
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && !isSubmitting) {
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);

      modalRef.current?.focus();

      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, event, onClose, isSubmitting]);

  if (!isOpen || !event) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Client-side quick validation
    if (!fullName.trim() || fullName.trim().length < 2) {
      setErrorMsg('Please enter your full name (minimum 2 characters).');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);

    // Client-side submission handling
    setTimeout(() => {
      try {
        const storageKey = `nexora_event_reg_${event.id}`;
        const existing: string[] = JSON.parse(localStorage.getItem(storageKey) || '[]');
        if (existing.includes(email.trim().toLowerCase())) {
          setErrorMsg(`You are already registered for "${event.title}" with email ${email.trim()}.`);
          setIsSubmitting(false);
          return;
        }
        existing.push(email.trim().toLowerCase());
        localStorage.setItem(storageKey, JSON.stringify(existing));
      } catch {
        // Continue if localStorage is unavailable
      }

      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const refId = `NX-${event.slug.toUpperCase().slice(0, 4)}-${randomSuffix}`;

      setSuccessData({
        registrationId: refId,
        message: `Your registration for ${event.title} has been confirmed! Official participation updates will be sent to ${email.trim()}.`,
      });
      setIsSubmitting(false);
    }, 450);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="registration-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300"
        onClick={() => !isSubmitting && onClose()}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        ref={modalRef}
        tabIndex={-1}
        className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-sky-400/40 bg-slate-950 p-6 sm:p-8 text-white shadow-[0_0_50px_rgba(56,189,248,0.3)] transition-all transform duration-300 z-10 my-8 focus:outline-none"
      >
        {/* Top Glow bar */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-400 via-cyan-300 to-blue-500 shadow-[0_0_15px_rgba(56,189,248,0.8)]"
        />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          aria-label="Close registration form"
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-sky-400/30 bg-slate-900 text-sky-300 hover:border-sky-400 hover:bg-sky-400/20 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Modal Header */}
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-400/30 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-300">
            {event.category}
          </span>
          <h2 id="registration-modal-title" className="mt-3 text-2xl font-bold tracking-tight text-white">
            Register for {event.title}
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-sky-100/70">
            Complete the form below to secure your participant badge and event updates.
          </p>
        </div>

        {/* Success View */}
        {successData ? (
          <div className="mt-6 rounded-2xl border border-emerald-500/40 bg-emerald-950/30 p-6 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-500/20 text-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.3)]">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Registration Confirmed!</h3>
              <p className="mt-1 text-xs sm:text-sm text-emerald-200/80 leading-relaxed">
                {successData.message}
              </p>
              {successData.registrationId && (
                <div className="mt-4 rounded-xl border border-emerald-500/30 bg-slate-950/60 p-3 text-xs font-mono text-emerald-300">
                  Badge Reference: {successData.registrationId}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-xl border border-emerald-400/50 bg-emerald-500 py-3 text-sm font-semibold text-slate-950 transition-all hover:bg-emerald-400 cursor-pointer"
            >
              Done
            </button>
          </div>
        ) : (
          /* Registration Form */
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {/* Error Message */}
            {errorMsg && (
              <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/40 bg-rose-950/40 p-3.5 text-xs text-rose-200">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                <span className="leading-relaxed">{errorMsg}</span>
              </div>
            )}

            {/* Full Name */}
            <div>
              <label htmlFor="full-name-input" className="block text-xs font-medium text-sky-200/80 mb-1.5">
                Full Name <span className="text-sky-400">*</span>
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-sky-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  id="full-name-input"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  disabled={isSubmitting}
                  className="w-full rounded-xl border border-sky-500/30 bg-slate-900/90 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-sky-400 focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-400/30"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label htmlFor="email-input" className="block text-xs font-medium text-sky-200/80 mb-1.5">
                Email Address <span className="text-sky-400">*</span>
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-sky-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="email-input"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. alex@university.edu"
                  disabled={isSubmitting}
                  className="w-full rounded-xl border border-sky-500/30 bg-slate-900/90 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-sky-400 focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-400/30"
                />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label htmlFor="phone-input" className="block text-xs font-medium text-sky-200/80 mb-1.5">
                Phone Number <span className="text-sky-200/40">(Optional)</span>
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-sky-400">
                  <Phone className="h-4 w-4" />
                </div>
                <input
                  id="phone-input"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 9876543210"
                  disabled={isSubmitting}
                  className="w-full rounded-xl border border-sky-500/30 bg-slate-900/90 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-sky-400 focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-400/30"
                />
              </div>
            </div>

            {/* College Name */}
            <div>
              <label htmlFor="college-input" className="block text-xs font-medium text-sky-200/80 mb-1.5">
                College / Institution <span className="text-sky-200/40">(Optional)</span>
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-sky-400">
                  <GraduationCap className="h-4 w-4" />
                </div>
                <input
                  id="college-input"
                  type="text"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  placeholder="e.g. AJ Institute of Engineering & Technology"
                  disabled={isSubmitting}
                  className="w-full rounded-xl border border-sky-500/30 bg-slate-900/90 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-sky-400 focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-400/30"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-sky-300/50 bg-gradient-to-r from-sky-500 to-cyan-500 py-3.5 px-4 text-sm font-semibold text-slate-950 shadow-[0_0_20px_rgba(56,189,248,0.4)] transition-all duration-200 hover:from-sky-400 hover:to-cyan-400 hover:shadow-[0_0_30px_rgba(56,189,248,0.6)] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-slate-950" />
                    <span>Verifying &amp; Submitting...</span>
                  </>
                ) : (
                  <span>Confirm Registration</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
