"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import type { HomepageAchievement } from "@/lib/home-achievements";

function getYear(achievement: HomepageAchievement) {
  const displayYear = achievement.dateDisplay?.match(/\b(?:19|20)\d{2}(?:\s*[-–]\s*(?:19|20)?\d{2})?\b/)?.[0];
  return displayYear ?? achievement.achievementDate?.slice(0, 4) ?? null;
}

function getEventName(achievement: HomepageAchievement) {
  return achievement.competitionOrEvent?.trim() || "Event not listed";
}

export default function HomeAchievementsSection({
  achievements,
  unavailable,
}: {
  achievements: HomepageAchievement[];
  unavailable: boolean;
}) {
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const cursorX = useMotionValue(-400);
  const cursorY = useMotionValue(-400);
  const previewX = useSpring(cursorX, { stiffness: 120, damping: 22 });
  const previewY = useSpring(cursorY, { stiffness: 120, damping: 22 });
  const preview = previewIndex === null ? null : achievements[previewIndex];

  function movePreview(event: MouseEvent<HTMLElement>) {
    cursorX.set(Math.min(event.clientX + 24, window.innerWidth - 244));
    cursorY.set(Math.min(event.clientY + 18, window.innerHeight - 184));
  }

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || prefersReducedMotion) return;

    const rows = Array.from(section.querySelectorAll<HTMLElement>(".home-achievement-row"));
    section.dataset.motionReady = "true";

    const revealVisibleRows = () => {
      rows.forEach((row) => {
        const bounds = row.getBoundingClientRect();
        if (bounds.top < window.innerHeight * 0.9 && bounds.bottom > 0) {
          row.dataset.visible = "true";
        }
      });
    };

    revealVisibleRows();
    const observer = "IntersectionObserver" in window
      ? new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              (entry.target as HTMLElement).dataset.visible = "true";
              observer?.unobserve(entry.target);
            }
          });
        }, { threshold: 0.15 })
      : null;

    rows.forEach((row) => observer?.observe(row));
    window.addEventListener("scroll", revealVisibleRows, { passive: true });
    window.addEventListener("resize", revealVisibleRows);

    return () => {
      observer?.disconnect();
      window.removeEventListener("scroll", revealVisibleRows);
      window.removeEventListener("resize", revealVisibleRows);
      delete section.dataset.motionReady;
    };
  }, [achievements.length, prefersReducedMotion]);

  return (
    <section
      ref={sectionRef}
      className="home-achievements-section"
      aria-labelledby="home-achievements-heading"
    >
      <div className="home-achievements-inner">
        <header className="home-achievements-header">
          <p className="home-achievements-kicker">NEXORA · ACHIEVEMENTS</p>
          <h2 id="home-achievements-heading">
            Student <span>achievements.</span>
          </h2>
          <p>Wins, awards and projects from our students.</p>
        </header>

        {unavailable ? (
          <p className="home-achievements-empty" role="status">
            Achievements are temporarily unavailable.
          </p>
        ) : achievements.length === 0 ? (
          <p className="home-achievements-empty" role="status">
            Our wins will appear here.
          </p>
        ) : (
          <div className="home-achievements-list">
            {achievements.map((achievement, index) => (
              <article
                key={achievement.id}
                className={`home-achievement-row${index === 0 ? " home-achievement-row--featured" : ""}`}
                style={{ transitionDelay: `${index * 100}ms` }}
                onMouseEnter={achievement.image ? () => setPreviewIndex(index) : undefined}
                onMouseMove={achievement.image ? movePreview : undefined}
                onMouseLeave={achievement.image ? () => setPreviewIndex(null) : undefined}
              >
                <span className="home-achievement-index" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="home-achievement-copy">
                  <h3>{achievement.title}</h3>
                  <p className="home-achievement-meta">
                    <span>{getEventName(achievement)}</span>
                    {getYear(achievement) && (
                      <>
                        <span aria-hidden="true"> · </span>
                        <span>{getYear(achievement)}</span>
                      </>
                    )}
                  </p>
                </div>
                <span className="home-achievement-position">
                  {achievement.awardOrPosition?.trim() || "Position not listed"}
                </span>
              </article>
            ))}
          </div>
        )}

        <div className="home-achievements-footer">
          <Link href="/achievements">
            All achievements <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>

      <AnimatePresence>
        {preview && preview.image && (
          <motion.div
            key={preview.id}
            className="home-achievement-cursor-preview"
            style={{ x: previewX, y: previewY }}
            initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.96, rotate: -3 }}
            animate={{ opacity: 1, scale: 1, rotate: -3 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.96, rotate: -3 }}
            transition={prefersReducedMotion ? { duration: 0 } : { type: "spring", stiffness: 120, damping: 22 }}
            aria-hidden="true"
          >
            <Image src={preview.image} alt="" fill unoptimized sizes="220px" />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
