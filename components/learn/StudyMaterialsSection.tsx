"use client";

import React, { useState, useMemo } from "react";
import { LearningResource } from "./learnData";
import { BookOpen, Download, Filter, FileText, ExternalLink } from "./Icons";

interface StudyMaterialsSectionProps {
  resources: LearningResource[];
  searchQuery: string;
}

export default function StudyMaterialsSection({
  resources,
  searchQuery,
}: StudyMaterialsSectionProps) {
  const [selectedSemester, setSelectedSemester] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const semesters = useMemo(() => {
    const list = Array.from(
      new Set(resources.map((r) => (r.semester ? String(r.semester) : "")).filter(Boolean))
    );
    return list.sort();
  }, [resources]);

  const categories = [
    { key: "all", label: "All Formats" },
    { key: "notes", label: "Notes & Lectures" },
    { key: "question_papers", label: "Question Papers" },
    { key: "tutorials", label: "Tutorials" },
  ];

  // Filtering based on search query, semester, and category
  const filteredResources = useMemo(() => {
    return resources.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.subject.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        (item.tags && item.tags.some((t) => t.toLowerCase().includes(q)));

      const matchSemester =
        selectedSemester === "all" ||
        (item.semester && String(item.semester) === selectedSemester);

      const matchCategory =
        selectedCategory === "all" || item.category === selectedCategory;

      return matchSearch && matchSemester && matchCategory;
    });
  }, [resources, searchQuery, selectedSemester, selectedCategory]);

  // Split into 2 columns for a natural 2-column ledger
  const leftCol = filteredResources.filter((_, i) => i % 2 === 0);
  const rightCol = filteredResources.filter((_, i) => i % 2 === 1);

  return (
    <section id="study-materials" className="relative mx-auto w-full max-w-7xl px-6 sm:px-10 lg:px-12 py-14">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 pb-6 border-b border-[var(--theme-primary,#00f0ff)]/20">
        <div>
          <div className="flex items-center gap-2 text-[var(--theme-primary,#00f0ff)]">
            <BookOpen className="h-4 w-4" />
            <span className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-[var(--theme-primary,#00f0ff)]/70">
              Academic Library
            </span>
          </div>
          <h2 className="mt-2 font-clash font-bold text-3xl sm:text-4xl text-[var(--theme-bg-hero,#dce6ef)] tracking-tight">
            Recently Added Resources<span className="text-[var(--theme-primary,#00f0ff)]">.</span>
          </h2>
          <p className="mt-1 font-cabinet font-medium text-sm text-white/70">
            Notes, syllabus breakdowns, solved model papers, and VTU reference material.
          </p>
        </div>

        <div className="font-mono text-xs text-white/50">
          Showing <span className="text-[var(--theme-primary,#00f0ff)] font-semibold">{filteredResources.length}</span> items
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 py-3 border-b border-[var(--theme-primary,#00f0ff)]/15">
        {/* Semester Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 font-mono text-xs text-white/50 mr-1">
            <Filter className="h-3 w-3 text-[var(--theme-primary,#00f0ff)]" /> Semester:
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

        {/* Category Filter */}
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-3 py-1 font-mono text-xs uppercase tracking-wider transition-colors ${
                selectedCategory === cat.key
                  ? "bg-[var(--theme-primary,#00f0ff)] text-[var(--theme-bg-main,#060913)] font-bold"
                  : "text-white/60 hover:text-white"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Resource Ledger - 2-Column Structured Ledger */}
      <div className="mt-4">
        {filteredResources.length === 0 ? (
          <div className="py-16 text-center border border-[var(--theme-primary,#00f0ff)]/15 bg-[#060a14]">
            <FileText className="mx-auto h-8 w-8 text-[var(--theme-primary,#00f0ff)]/40" />
            <h3 className="mt-3 font-clash font-bold text-base text-[var(--theme-bg-hero,#dce6ef)]">
              No study resources match your search or filter criteria.
            </h3>
            <p className="mt-1 font-cabinet text-xs text-white/50 max-w-md mx-auto">
              Try adjusting your search keywords or clearing filters to see all available study resources.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-x-6 lg:gap-y-4">
            {/* Left Column */}
            <div className="grid content-start gap-4">
              {leftCol.map((item) => (
                <div key={item.id} className="group min-w-0 rounded-xl border border-[var(--theme-primary,#00f0ff)]/15 bg-[#080f18]/95 p-5 shadow-[0_12px_32px_rgba(0,0,0,0.18)] transition-colors hover:border-[var(--theme-primary,#00f0ff)]/35 sm:p-6">
                  <div className="flex items-center justify-between gap-3 font-mono text-xs text-slate-300">
                    <span className="text-[var(--theme-primary,#00f0ff)] font-semibold uppercase tracking-wider">
                      {item.semester ? `Semester ${item.semester}` : "General"} · {item.subject}
                    </span>
                    <span className="flex shrink-0 items-center gap-1.5 text-slate-400">
                      <FileText className="h-3 w-3" />
                      {item.fileType || "PDF"}
                    </span>
                  </div>

                  <h3 className="mt-1.5 font-clash font-bold text-base sm:text-lg text-[var(--theme-bg-hero,#dce6ef)] group-hover:text-[var(--theme-primary,#00f0ff)] transition-colors">
                    {item.title}
                  </h3>

                  <p className="mt-1.5 font-cabinet text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {item.description}
                  </p>

                  <div className="mt-3 flex items-center justify-between gap-4">
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 font-mono text-[10px] text-slate-300">
                        {item.tags.map((tag) => (
                          <span key={tag} className="border border-[var(--theme-primary,#00f0ff)]/25 bg-black/20 px-1.5 py-0.5">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <a
                      href={item.fileUrl || "#"}
                      target={item.fileUrl && item.fileUrl !== "#" ? "_blank" : undefined}
                      rel="noopener noreferrer"
                      className="shrink-0 inline-flex items-center gap-1.5 border border-[var(--theme-primary,#00f0ff)]/30 px-3 py-1 font-mono text-xs uppercase tracking-wider text-[var(--theme-primary,#00f0ff)] hover:bg-[var(--theme-primary,#00f0ff)] hover:text-[var(--theme-bg-main,#060913)] transition-all"
                    >
                      {item.fileUrl && item.fileUrl.startsWith("http") ? (
                        <>
                          <span>Access</span>
                          <ExternalLink className="h-3 w-3" />
                        </>
                      ) : (
                        <>
                          <span>Download</span>
                          <Download className="h-3 w-3" />
                        </>
                      )}
                    </a>
                  </div>
                </div>
              ))}
            </div>

            {/* Right Column */}
            <div className="grid content-start gap-4">
              {rightCol.map((item) => (
                <div key={item.id} className="group min-w-0 rounded-xl border border-[var(--theme-primary,#00f0ff)]/15 bg-[#080f18]/95 p-5 shadow-[0_12px_32px_rgba(0,0,0,0.18)] transition-colors hover:border-[var(--theme-primary,#00f0ff)]/35 sm:p-6">
                  <div className="flex items-center justify-between gap-3 font-mono text-xs text-slate-300">
                    <span className="text-[var(--theme-primary,#00f0ff)] font-semibold uppercase tracking-wider">
                      {item.semester ? `Semester ${item.semester}` : "General"} · {item.subject}
                    </span>
                    <span className="flex shrink-0 items-center gap-1.5 text-slate-400">
                      <FileText className="h-3 w-3" />
                      {item.fileType || "PDF"}
                    </span>
                  </div>

                  <h3 className="mt-1.5 font-clash font-bold text-base sm:text-lg text-[var(--theme-bg-hero,#dce6ef)] group-hover:text-[var(--theme-primary,#00f0ff)] transition-colors">
                    {item.title}
                  </h3>

                  <p className="mt-1.5 font-cabinet text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {item.description}
                  </p>

                  <div className="mt-3 flex items-center justify-between gap-4">
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 font-mono text-[10px] text-slate-300">
                        {item.tags.map((tag) => (
                          <span key={tag} className="border border-[var(--theme-primary,#00f0ff)]/25 bg-black/20 px-1.5 py-0.5">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <a
                      href={item.fileUrl || "#"}
                      target={item.fileUrl && item.fileUrl !== "#" ? "_blank" : undefined}
                      rel="noopener noreferrer"
                      className="shrink-0 inline-flex items-center gap-1.5 border border-[var(--theme-primary,#00f0ff)]/30 px-3 py-1 font-mono text-xs uppercase tracking-wider text-[var(--theme-primary,#00f0ff)] hover:bg-[var(--theme-primary,#00f0ff)] hover:text-[var(--theme-bg-main,#060913)] transition-all"
                    >
                      {item.fileUrl && item.fileUrl.startsWith("http") ? (
                        <>
                          <span>Access</span>
                          <ExternalLink className="h-3 w-3" />
                        </>
                      ) : (
                        <>
                          <span>Download</span>
                          <Download className="h-3 w-3" />
                        </>
                      )}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
