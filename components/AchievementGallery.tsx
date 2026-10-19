"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Award, Sparkles } from "lucide-react";

export type Achievement = {
  id?: string;
  category: string;
  title: string;
  description: string;
  event: string;
  date: string;
  image?: string;
  isSample?: boolean;
};

const DEFAULT_ACHIEVEMENTS: Achievement[] = [];

interface AchievementGalleryProps {
  initialAchievements?: Achievement[];
}

export default function AchievementGallery({ initialAchievements }: AchievementGalleryProps) {
  const [items, setItems] = useState<Achievement[]>(
    initialAchievements && initialAchievements.length > 0
      ? initialAchievements
      : DEFAULT_ACHIEVEMENTS
  );
  const [loading, setLoading] = useState<boolean>(!initialAchievements);
  const galleryRef = useRef<HTMLElement>(null);

  useEffect(() => {
    fetch('/api/achievements')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.achievements)) {
          const mapped: Achievement[] = data.achievements.map((a: any) => ({
            id: a.id,
            category: a.category,
            title: a.title,
            description: a.description,
            event: a.competitionOrEvent || a.studentOrTeamName || 'Nexora Department',
            date: a.dateDisplay || (a.achievementDate ? new Date(a.achievementDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '2026'),
            image: a.image || undefined,
            isSample: false,
          }));
          setItems(mapped);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch achievements:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const gallery = galleryRef.current;
    if (!gallery) return;

    const cards = gallery.querySelectorAll<HTMLElement>(".achievement-reveal");
    document.documentElement.classList.add("achievement-motion-ready");

    if (!("IntersectionObserver" in window)) {
      cards.forEach((card) => card.setAttribute("data-visible", "true"));
      return () => document.documentElement.classList.remove("achievement-motion-ready");
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.setAttribute("data-visible", "true");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 },
    );

    cards.forEach((card) => observer.observe(card));

    return () => {
      observer.disconnect();
      document.documentElement.classList.remove("achievement-motion-ready");
    };
  }, [items]);

  return (
    <section
      ref={galleryRef}
      id="achievements"
      aria-labelledby="achievements-title"
      className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-20 pt-28 sm:px-8 sm:pb-24 lg:px-12"
    >
      <div className="mx-auto mb-12 max-w-3xl text-center sm:mb-16">
        <p className="mb-4 text-xs font-bold uppercase tracking-[0.35em] text-[var(--theme-primary,#00f0ff)] font-terminal">
          Nexora · ISE Department
        </p>
        <h1
          id="achievements-title"
          className="font-clash font-bold text-4xl sm:text-5xl md:text-6xl tracking-tight text-[var(--theme-bg-hero,#dce6ef)]"
        >
          Our Achievements
        </h1>
        <p className="mt-4 text-base leading-relaxed text-[var(--theme-primary,#00f0ff)]/80 sm:text-lg font-cabinet">
          Celebrating innovation, competitive coding victories, and engineering milestones.
        </p>
        <div
          aria-hidden="true"
          className="mx-auto mt-6 h-px w-36 bg-gradient-to-r from-transparent via-[var(--theme-primary,#00f0ff)] to-transparent"
        />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--theme-primary,#00f0ff)] border-t-transparent" />
          <p className="mt-4 text-xs font-mono uppercase tracking-widest text-[var(--theme-primary,#00f0ff)]/70">
            Loading achievements...
          </p>
        </div>
      ) : items.length === 0 ? (
        <div className="relative mx-auto max-w-2xl overflow-hidden rounded-2xl border border-[var(--theme-primary,#00f0ff)]/20 bg-[#03080a] p-10 sm:p-14 text-center shadow-xl">
          <div aria-hidden className="terminal-scanlines opacity-20 pointer-events-none" />
          <div className="relative z-10 flex flex-col items-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--theme-primary,#00f0ff)]/30 bg-[var(--theme-primary,#00f0ff)]/10 text-[var(--theme-primary,#00f0ff)] shadow-[0_0_25px_rgba(0,240,255,0.25)]">
              <Award className="h-7 w-7 text-[var(--theme-primary,#00f0ff)]" />
            </div>
            <h3 className="mt-5 text-xl sm:text-2xl font-clash font-bold text-[var(--theme-bg-hero,#dce6ef)]">
              No Achievements Published Yet
            </h3>
            <p className="mt-3 max-w-md text-xs sm:text-sm text-white/70 font-cabinet leading-relaxed">
              Student hackathon victories, competition awards, and project showcases will appear here as they are published by the department.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-[var(--theme-primary,#00f0ff)]/30 bg-[var(--theme-primary,#00f0ff)]/5 px-4 py-1.5 text-xs font-mono text-[var(--theme-primary,#00f0ff)]">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Records are verified & published via the Admin Portal</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {items.map((achievement, index) => (
            <article
              key={achievement.id || `${achievement.title}-${index}`}
              className="achievement-reveal group relative flex min-h-72 flex-col overflow-hidden rounded-xl border border-[var(--theme-primary,#00f0ff)]/20 bg-[#03080a] p-6 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-[var(--theme-primary,#00f0ff)]/60 sm:p-7"
              style={{ transitionDelay: `${(index % 3) * 100}ms` }}
            >
              <div aria-hidden className="terminal-scanlines opacity-20 pointer-events-none" />

              {achievement.image ? (
                <div className="relative mb-6 h-40 overflow-hidden rounded-xl border border-[var(--theme-primary,#00f0ff)]/20">
                  <Image
                    src={achievement.image}
                    alt={achievement.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                </div>
              ) : null}
              <div className="relative flex items-center justify-between gap-3">
                <span className="rounded-full border border-[var(--theme-primary,#00f0ff)]/30 bg-[var(--theme-primary,#00f0ff)]/10 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[var(--theme-primary,#00f0ff)] font-mono">
                  {achievement.category}
                </span>
                <span className="shrink-0 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[var(--theme-primary,#00f0ff)] font-mono">
                  Verified
                </span>
              </div>
              <h2 className="relative mt-5 text-xl font-clash font-bold leading-snug text-[var(--theme-bg-hero,#dce6ef)] group-hover:text-white transition-colors">
                {achievement.title}
              </h2>
              <p className="relative mt-2.5 text-xs sm:text-sm leading-relaxed text-white/70 font-cabinet">
                {achievement.description}
              </p>
              <div className="relative mt-auto flex flex-col gap-2 border-t border-[var(--theme-primary,#00f0ff)]/15 pt-4 text-xs text-[var(--theme-primary,#00f0ff)]/70 font-mono sm:flex-row sm:items-center sm:justify-between">
                <span>{achievement.event}</span>
                <span className="text-[var(--theme-bg-hero,#dce6ef)]">{achievement.date}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
