"use client";

import React, { useState, useMemo, useEffect } from "react";
import { ExamSchedule } from "./learnData";
import { CalendarDays, Filter, Clock, MapPin, CheckCircle } from "./Icons";

interface UpcomingExamsProps {
  exams: ExamSchedule[];
}

export default function UpcomingExams({ exams }: UpcomingExamsProps) {
  const [selectedSemester, setSelectedSemester] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");

  const semesters = useMemo(() => {
    const list = Array.from(new Set(exams.map((e) => String(e.semester))));
    return list.sort();
  }, [exams]);

  const examTypes = useMemo(() => {
    return Array.from(new Set(exams.map((e) => e.examType)));
  }, [exams]);

  const filteredExams = useMemo(() => {
    return exams.filter((exam) => {
      const matchSem =
        selectedSemester === "all" || String(exam.semester) === selectedSemester;
      const matchType =
        selectedType === "all" || exam.examType === selectedType;
      return matchSem && matchType;
    });
  }, [exams, selectedSemester, selectedType]);

  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setNow(Date.now());
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Compute countdown for nearest published exam
  const nextExam = useMemo(() => {
    if (!now) return null;
    const valid = exams
      .filter((e) => e.isPublished && new Date(e.date).getTime() > now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return valid.length > 0 ? valid[0] : null;
  }, [exams, now]);

  const getDaysRemaining = (targetDateStr: string) => {
    if (!now) return "Upcoming";
    const target = new Date(targetDateStr).getTime();
    const diff = target - now;
    if (diff <= 0) return "Today / In Progress";
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return `${days} ${days === 1 ? "day" : "days"} away`;
  };

  return (
    <section id="upcoming-exams" className="relative mx-auto w-full max-w-7xl px-6 sm:px-10 lg:px-12 py-14">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 pb-6 border-b border-[var(--theme-primary,#00f0ff)]/20">
        <div>
          <div className="flex items-center gap-2 text-[var(--theme-primary,#00f0ff)]">
            <CalendarDays className="h-4 w-4" />
            <span className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-[var(--theme-primary,#00f0ff)]/70">
              Department Schedule
            </span>
          </div>
          <h2 className="mt-2 font-clash font-bold text-3xl sm:text-4xl text-[var(--theme-bg-hero,#dce6ef)] tracking-tight">
            Upcoming Exams<span className="text-[var(--theme-primary,#00f0ff)]">.</span>
          </h2>
          <p className="mt-1 font-cabinet font-medium text-sm text-white/70">
            Official dates, halls, and timing verified by the ISE examination board.
          </p>
        </div>

        {/* Timetable summary */}
        <div className="flex items-center gap-3">
          <div className="border border-[var(--theme-primary,#00f0ff)]/30 px-4 py-2 font-mono text-xs">
            <span className="text-white/60">Verified Timetable · </span>
            <span className="text-[var(--theme-primary,#00f0ff)] font-semibold">{exams.length} Sessions</span>
          </div>
        </div>
      </div>

      {/* Featured Nearest Exam Strip - Clean Technical Banner */}
      {nextExam && (
        <div className="mt-6 border border-[var(--theme-primary,#00f0ff)]/30 bg-[#060a14] p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <Clock className="h-4 w-4 text-[var(--theme-primary,#00f0ff)] mt-1 shrink-0" />
              <div>
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="uppercase text-[var(--theme-primary,#00f0ff)] font-bold tracking-wider">
                    Next Upcoming Session
                  </span>
                  <span className="text-white/40">•</span>
                  <span className="text-white/60">
                    Semester {nextExam.semester} · {nextExam.subjectCode}
                  </span>
                </div>
                <h3 className="mt-1 font-clash font-bold text-lg text-[var(--theme-bg-hero,#dce6ef)]">
                  {nextExam.title}
                </h3>
                <p className="mt-1 font-mono text-xs text-white/70">
                  {new Date(nextExam.date).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}{" "}
                  · {nextExam.time} {nextExam.venue ? `· Hall: ${nextExam.venue}` : ""}
                </p>
              </div>
            </div>

            <div className="shrink-0 self-start sm:self-auto">
              <div className="inline-flex items-center gap-2 border border-[var(--theme-primary,#00f0ff)]/40 px-3.5 py-1.5 font-mono text-xs text-[var(--theme-primary,#00f0ff)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--theme-primary,#00f0ff)] animate-pulse" />
                <span className="font-bold uppercase tracking-wider">{getDaysRemaining(nextExam.date)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Toolbar - Clean, Understated Technical Filters */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 py-3 border-y border-[var(--theme-primary,#00f0ff)]/15">
        {/* Semester Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 font-mono text-xs text-white/50 mr-1">
            <Filter className="h-3 w-3 text-[var(--theme-primary,#00f0ff)]" /> Sem:
          </span>
          <button
            type="button"
            onClick={() => setSelectedSemester("all")}
            className={`px-3 py-1 font-mono text-xs uppercase tracking-wider transition-colors ${
              selectedSemester === "all"
                ? "bg-[var(--theme-primary,#00f0ff)] text-[var(--theme-bg-main,#060913)] font-bold"
                : "text-white/60 hover:text-white"
            }`}
          >
            All
          </button>
          {semesters.map((sem) => (
            <button
              key={sem}
              type="button"
              onClick={() => setSelectedSemester(sem)}
              className={`px-3 py-1 font-mono text-xs uppercase tracking-wider transition-colors ${
                selectedSemester === sem
                  ? "bg-[var(--theme-primary,#00f0ff)] text-[var(--theme-bg-main,#060913)] font-bold"
                : "text-white/60 hover:text-white"
              }`}
            >
              Sem {sem}
            </button>
          ))}
        </div>

        {/* Type Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs text-white/50 mr-1">Type:</span>
          <button
            type="button"
            onClick={() => setSelectedType("all")}
            className={`px-3 py-1 font-mono text-xs uppercase tracking-wider transition-colors ${
              selectedType === "all"
                ? "bg-[var(--theme-primary,#00f0ff)] text-[var(--theme-bg-main,#060913)] font-bold"
                : "text-white/60 hover:text-white"
            }`}
          >
            All Types
          </button>
          {examTypes.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1 font-mono text-xs uppercase tracking-wider transition-colors ${
                selectedType === type
                  ? "bg-[var(--theme-primary,#00f0ff)] text-[var(--theme-bg-main,#060913)] font-bold"
                  : "text-white/60 hover:text-white"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Examination Schedule Table / Ledger Layout */}
      <div className="mt-4">
        {filteredExams.length === 0 ? (
          <div className="py-16 text-center border border-[var(--theme-primary,#00f0ff)]/15 bg-[#060a14]">
            <CalendarDays className="mx-auto h-8 w-8 text-[var(--theme-primary,#00f0ff)]/40" />
            <h3 className="mt-3 font-clash font-bold text-base text-[var(--theme-bg-hero,#dce6ef)]">
              No upcoming exams match this filter.
            </h3>
            <p className="mt-1 font-cabinet text-xs text-white/50">
              Clear or change your filters to see the complete departmental schedule.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--theme-primary,#00f0ff)]/15 border-b border-[var(--theme-primary,#00f0ff)]/15">
            {/* Table Header - Desktop */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2.5 font-mono text-xs uppercase tracking-wider text-white/40">
              <div className="col-span-3">Date &amp; Time</div>
              <div className="col-span-5">Course / Subject</div>
              <div className="col-span-2">Venue</div>
              <div className="col-span-2 text-right">Status</div>
            </div>

            {/* Schedule Rows */}
            {filteredExams.map((exam) => (
              <div
                key={exam.id}
                className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 px-4 py-4 items-start md:items-center hover:bg-[var(--theme-primary,#00f0ff)]/5 transition-colors"
              >
                {/* Date & Time Column */}
                <div className="col-span-1 md:col-span-3">
                  <p className="font-mono text-xs font-semibold text-[var(--theme-bg-hero,#dce6ef)]">
                    {new Date(exam.date).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                  <p className="font-mono text-xs text-white/50 flex items-center gap-1.5 mt-0.5">
                    <Clock className="h-3 w-3 text-[var(--theme-primary,#00f0ff)]" />
                    <span>{exam.time}</span>
                  </p>
                </div>

                {/* Course Name & Subject Code Column */}
                <div className="col-span-1 md:col-span-5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-[var(--theme-primary,#00f0ff)] border border-[var(--theme-primary,#00f0ff)]/30 px-1.5 py-0.5">
                      Sem {exam.semester}
                    </span>
                    <span className="font-mono text-xs text-white/50">{exam.subjectCode}</span>
                    <span className="font-mono text-[11px] text-white/40">• {exam.examType}</span>
                  </div>
                  <h4 className="mt-1 font-clash font-bold text-base text-[var(--theme-bg-hero,#dce6ef)]">
                    {exam.title}
                  </h4>
                </div>

                {/* Venue Column */}
                <div className="col-span-1 md:col-span-2">
                  {exam.venue ? (
                    <p className="font-mono text-xs text-white/70 flex items-center gap-1.5">
                      <MapPin className="h-3 w-3 text-[var(--theme-primary,#00f0ff)]" />
                      <span>{exam.venue}</span>
                    </p>
                  ) : (
                    <span className="font-mono text-xs text-white/30">—</span>
                  )}
                </div>

                {/* Status Column */}
                <div className="col-span-1 md:col-span-2 md:text-right">
                  <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-emerald-400">
                    <CheckCircle className="h-3 w-3 text-emerald-400" />
                    Verified Schedule
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
