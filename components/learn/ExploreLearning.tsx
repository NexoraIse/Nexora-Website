"use client";

import React from "react";
import { BookOpen, CalendarDays, Code2, ArrowRight } from "./Icons";

interface ExploreLearningProps {
  onCardClick?: (sectionId: string) => void;
  materialsCount?: number;
  examsCount?: number;
  skillsCount?: number;
}

export default function ExploreLearning({
  onCardClick,
  materialsCount = 6,
  examsCount = 5,
  skillsCount = 6,
}: ExploreLearningProps) {
  const pathways = [
    {
      id: "study-materials",
      index: "01",
      title: "Study Materials",
      description: "Notes, PDFs and question papers.",
      details: "Browse subject notes, past VTU question papers, and lab manuals organized by semester.",
      icon: BookOpen,
      countLabel: `${materialsCount} Resources`,
      actionLabel: "Browse Materials",
    },
    {
      id: "upcoming-exams",
      index: "02",
      title: "Exam Corner",
      description: "Exam timetables and schedules.",
      details: "Official Internal Assessments & Semester-End timetables, hall allocations, and exam regulations.",
      icon: CalendarDays,
      countLabel: `${examsCount} Scheduled`,
      actionLabel: "View Schedules",
    },
    {
      id: "skill-development",
      index: "03",
      title: "Skill Development",
      description: "Courses, coding and tutorials.",
      details: "Hands-on tracks for Full-Stack, Cloud & Supabase, DSA roadmaps, UI/UX systems, and Open Source.",
      icon: Code2,
      countLabel: `${skillsCount} Learning Tracks`,
      actionLabel: "Start Learning",
    },
  ];

  return (
    <section className="relative mx-auto w-full max-w-7xl px-6 sm:px-10 lg:px-12 py-10">
      {/* Section Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <span className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-[var(--theme-primary,#00f0ff)]/70">
            Repository Directory
          </span>
          <h2 className="mt-1 font-clash font-bold text-2xl sm:text-3xl text-[var(--theme-bg-hero,#dce6ef)] tracking-tight">
            Explore Learning<span className="text-[var(--theme-primary,#00f0ff)]">.</span>
          </h2>
        </div>
        <p className="font-cabinet text-sm text-white/60 max-w-md">
          Everything you need for semester excellence and technical career growth in one structured hub.
        </p>
      </div>

      {/* Directory Ledger Grid - Human Designed, Architectural */}
      <div className="border-y border-[var(--theme-primary,#00f0ff)]/20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[var(--theme-primary,#00f0ff)]/20">
          {pathways.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                onClick={() => {
                  const element = document.getElementById(item.id);
                  if (element) {
                    element.scrollIntoView({ behavior: "smooth" });
                  }
                  onCardClick?.(item.id);
                }}
                className="group relative flex cursor-pointer flex-col justify-between p-6 sm:p-7 transition-colors duration-200 hover:bg-[var(--theme-primary,#00f0ff)]/5"
              >
                <div>
                  {/* Item Index & Resource Counter */}
                  <div className="flex items-center justify-between font-mono text-xs text-white/40 mb-5">
                    <span className="text-[var(--theme-primary,#00f0ff)] font-bold">{item.index}</span>
                    <span>{item.countLabel}</span>
                  </div>

                  {/* Icon & Title */}
                  <div className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4 text-[var(--theme-primary,#00f0ff)] shrink-0" />
                    <h3 className="font-clash font-bold text-lg sm:text-xl text-[var(--theme-bg-hero,#dce6ef)] group-hover:text-[var(--theme-primary,#00f0ff)] transition-colors">
                      {item.title}
                    </h3>
                  </div>

                  <p className="mt-2 font-cabinet font-medium text-xs sm:text-sm text-[var(--theme-primary,#00f0ff)]/80">
                    {item.description}
                  </p>

                  <p className="mt-2.5 font-cabinet text-xs text-white/60 leading-relaxed">
                    {item.details}
                  </p>
                </div>

                {/* Text Action Link */}
                <div className="mt-6 pt-4 border-t border-[var(--theme-primary,#00f0ff)]/10 flex items-center justify-between">
                  <span className="font-mono text-xs uppercase tracking-wider text-[var(--theme-primary,#00f0ff)] group-hover:text-white transition-colors">
                    {item.actionLabel}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-[var(--theme-primary,#00f0ff)] group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
