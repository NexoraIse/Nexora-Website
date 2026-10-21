"use client";

import React, { useState, useMemo } from "react";
import { SkillResource } from "./learnData";
import { Laptop, ExternalLink } from "./Icons";

interface SkillDevelopmentProps {
  skills: SkillResource[];
  searchQuery?: string;
}

export default function SkillDevelopment({
  skills,
  searchQuery = "",
}: SkillDevelopmentProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = [
    "all",
    "Programming",
    "Web Development",
    "UI/UX Design",
    "AI & Data Science",
    "Communication & Soft Skills",
  ];

  const filteredSkills = useMemo(() => {
    return skills.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.provider.toLowerCase().includes(q) ||
        item.tags.some((t) => t.toLowerCase().includes(q));

      const matchCategory =
        selectedCategory === "all" || item.category === selectedCategory;

      return matchSearch && matchCategory;
    });
  }, [skills, searchQuery, selectedCategory]);

  return (
    <section id="skill-development" className="relative mx-auto w-full max-w-7xl px-6 sm:px-10 lg:px-12 py-14">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 pb-6 border-b border-[var(--theme-primary,#00f0ff)]/20">
        <div>
          <div className="flex items-center gap-2 text-[var(--theme-primary,#00f0ff)]">
            <Laptop className="h-4 w-4" />
            <span className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-[var(--theme-primary,#00f0ff)]/70">
              Technical Specializations
            </span>
          </div>
          <h2 className="mt-2 font-clash font-bold text-3xl sm:text-4xl text-[var(--theme-bg-hero,#dce6ef)] tracking-tight">
            Skill Development &amp; Tracks<span className="text-[var(--theme-primary,#00f0ff)]">.</span>
          </h2>
          <p className="mt-1 font-cabinet font-medium text-sm text-white/70">
            Curated industry roadmaps for web architecture, cloud engineering, UI/UX, and competitive programming.
          </p>
        </div>

        <div className="font-mono text-xs text-white/50">
          Curated by Nexora Mentors
        </div>
      </div>

      {/* Domain Filters */}
      <div className="mt-6 flex flex-wrap gap-2 pb-3 border-b border-[var(--theme-primary,#00f0ff)]/15">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 font-mono text-xs uppercase tracking-wider transition-colors ${
              selectedCategory === cat
                ? "bg-[var(--theme-primary,#00f0ff)] text-[var(--theme-bg-main,#060913)] font-bold"
                : "text-white/60 hover:text-white"
            }`}
          >
            {cat === "all" ? "All Skill Domains" : cat}
          </button>
        ))}
      </div>

      {/* Modular Course Curriculum Grid */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSkills.length === 0 ? (
          <div className="col-span-full py-16 text-center border border-[var(--theme-primary,#00f0ff)]/15 bg-[#060a14]">
            <Laptop className="mx-auto h-8 w-8 text-[var(--theme-primary,#00f0ff)]/40" />
            <h3 className="mt-3 font-clash font-bold text-base text-[var(--theme-bg-hero,#dce6ef)]">
              No skill tracks match your current filter.
            </h3>
            <p className="mt-1 font-cabinet text-xs text-white/50">
              Select another domain or clear your search to explore all tracks.
            </p>
          </div>
        ) : (
          filteredSkills.map((item, idx) => (
            <div
              key={item.id}
              className="group border border-[var(--theme-primary,#00f0ff)]/20 bg-[#060a14] p-6 flex flex-col justify-between hover:border-[var(--theme-primary,#00f0ff)]/50 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className="text-[var(--theme-primary,#00f0ff)] font-bold">
                    0{idx + 1} · {item.category}
                  </span>
                  <span className="text-white/50 border border-white/15 px-2 py-0.5 text-[10px] uppercase font-semibold">
                    {item.difficulty}
                  </span>
                </div>

                <h3 className="mt-3 font-clash font-bold text-lg text-[var(--theme-bg-hero,#dce6ef)] group-hover:text-[var(--theme-primary,#00f0ff)] transition-colors">
                  {item.title}
                </h3>

                <p className="mt-2 font-cabinet text-xs sm:text-sm text-white/65 leading-relaxed">
                  {item.description}
                </p>

                <div className="mt-4 font-mono text-xs text-white/40">
                  <span>Source: {item.provider}</span>
                  {item.estimatedTime && <span> · Est. {item.estimatedTime}</span>}
                </div>

                {item.tags && item.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5 font-mono text-[10px] text-white/40">
                    {item.tags.map((tag) => (
                      <span key={tag} className="border border-[var(--theme-primary,#00f0ff)]/15 px-1.5 py-0.5">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Link */}
              <div className="mt-6 pt-4 border-t border-[var(--theme-primary,#00f0ff)]/15 flex items-center justify-between">
                <span className="font-mono text-xs text-white/40">Open Curriculum</span>
                <a
                  href={item.externalLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 border border-[var(--theme-primary,#00f0ff)]/30 px-3 py-1 font-mono text-xs uppercase tracking-wider text-[var(--theme-primary,#00f0ff)] hover:bg-[var(--theme-primary,#00f0ff)] hover:text-[var(--theme-bg-main,#060913)] transition-all"
                >
                  <span>Start Track</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
