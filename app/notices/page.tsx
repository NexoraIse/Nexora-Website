"use client";

import React, { useState, useMemo, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import NoticeCard, {
  type Notice,
  type NoticeCategory,
  AttachmentIcon,
} from "@/components/NoticeCard";
import NoticeModal from "@/components/NoticeModal";
import ContourBackdrop from "@/components/ContourBackdrop";
import type { NoticeAttachment } from "@/components/NoticeCard";

type CategoryFilter = "All" | NoticeCategory;
type NoticeApiItem = {
  id: string;
  title: string;
  summary: string | null;
  content: string | null;
  category: string;
  priority: "NORMAL" | "IMPORTANT" | "URGENT";
  isPinned: boolean;
  date: string;
  authorName: string | null;
  authorRole: string | null;
  attachmentUrl: string | null;
  attachmentName: string | null;
  attachmentType: string | null;
};

const CATEGORIES: CategoryFilter[] = ["All", "Urgent", "Projects", "Events", "General"];

function normalizeCategory(category: string, priority: NoticeApiItem["priority"]): NoticeCategory {
  if (priority === "URGENT") return "Urgent";
  const normalized = category.trim().toLowerCase();
  if (normalized === "projects" || normalized === "project") return "Projects";
  if (normalized === "events" || normalized === "event") return "Events";
  return "General";
}

function normalizeAttachmentType(type: string | null): NoticeAttachment["type"] {
  if (type === "pdf" || type === "figma" || type === "doc" || type === "link") return type;
  return "link";
}

export default function NoticesPage() {
  const [noticesList, setNoticesList] = useState<Notice[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("All");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);

  useEffect(() => {
    fetch('/api/notices')
      .then((res) => res.json())
      .then((data: { notices?: NoticeApiItem[] }) => {
        if (data.notices && data.notices.length > 0) {
          const formatted: Notice[] = data.notices.map((n) => ({
            id: n.id,
            title: n.title,
            summary: n.summary || n.content?.slice(0, 160) || '',
            content: n.content || '',
            category: normalizeCategory(n.category, n.priority),
            isPinned: n.isPinned || false,
            isUrgentHero: n.priority === 'URGENT' || n.isPinned,
            postedAt: 'Recently',
            date: n.date || new Date().toISOString().slice(0, 10),
            author: {
              name: n.authorName || 'Nexora Executive Board',
              role: n.authorRole || 'ISE Department',
            },
            attachment: n.attachmentUrl ? {
              name: n.attachmentName || 'Attachment',
              url: n.attachmentUrl,
              type: normalizeAttachmentType(n.attachmentType),
              size: 'File',
            } : undefined,
            tags: [n.category?.toLowerCase() || 'general'],
          }));
          setNoticesList(formatted);
          const requestedNoticeId = new URLSearchParams(window.location.search).get('notice');
          if (requestedNoticeId) {
            setSelectedNotice(formatted.find((notice) => notice.id === requestedNoticeId) || null);
          }
        }
      })
      .catch(() => {});
  }, []);

  const closeNotice = () => {
    setSelectedNotice(null);
    const url = new URL(window.location.href);
    if (url.searchParams.has('notice')) {
      url.searchParams.delete('notice');
      window.history.replaceState({}, '', url);
    }
  };

  // Distinct Pinned / Urgent Hero Card Notice (Top priority)
  const heroNotice = useMemo(() => {
    return noticesList.find((n) => n.isUrgentHero) || noticesList[0];
  }, [noticesList]);

  // Filter and search logic
  const filteredNotices = useMemo(() => {
    let result = [...noticesList];

    // Filter by Category
    if (selectedCategory !== "All") {
      result = result.filter((notice) => notice.category === selectedCategory);
    }

    // Real-time Search by title, summary, content, author, or tags
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (notice) =>
          notice.title.toLowerCase().includes(q) ||
          notice.summary.toLowerCase().includes(q) ||
          notice.content.toLowerCase().includes(q) ||
          notice.author.name.toLowerCase().includes(q) ||
          notice.author.role.toLowerCase().includes(q) ||
          notice.tags?.some((tag) => tag.toLowerCase().includes(q))
      );
    }

    // Sort Order
    if (sortOrder === "oldest") {
      result.reverse();
    }

    return result;
  }, [noticesList, selectedCategory, searchQuery, sortOrder]);

  // Category counts for pill badges
  const categoryCounts = useMemo(() => {
    const counts: Record<CategoryFilter, number> = {
      All: noticesList.length,
      Urgent: 0,
      Projects: 0,
      Events: 0,
      General: 0,
    };
    noticesList.forEach((n) => {
      counts[n.category] = (counts[n.category] || 0) + 1;
    });
    return counts;
  }, [noticesList]);

  // Check if Hero card matches current search/filter
  const showHeroBanner = useMemo(() => {
    if (!heroNotice) return false;
    if (selectedCategory !== "All" && heroNotice.category !== selectedCategory) {
      return false;
    }
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase().trim();
      return (
        heroNotice.title.toLowerCase().includes(q) ||
        heroNotice.summary.toLowerCase().includes(q) ||
        heroNotice.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }
    return true;
  }, [heroNotice, selectedCategory, searchQuery]);

  return (
    <main className="relative isolate min-h-screen w-full bg-[var(--theme-bg-main,#060913)] text-[var(--theme-bg-hero,#dce6ef)]">
      <ContourBackdrop />

      {/* Global Navbar */}
      <Navbar />

      {/* Main Noticeboard Content Container */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-28 pb-20 sm:px-6 lg:px-8">
        
        {/* ========================================================================= */}
        {/* 1. PAGE HEADER */}
        {/* ========================================================================= */}
        <section className="text-center mb-10 sm:mb-14">
          
          {/* Department Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--theme-primary,#00f0ff)]/40 bg-[var(--theme-primary,#00f0ff)]/10 px-4 py-1.5 text-xs font-bold text-[var(--theme-primary,#00f0ff)] backdrop-blur-md shadow-[0_0_12px_rgba(0, 240, 255,0.2)] mb-4 uppercase tracking-[0.2em] font-terminal">
            <span className="h-2 w-2 rounded-full bg-[var(--theme-primary,#00f0ff)] animate-pulse shadow-[0_0_8px_var(--theme-primary,#00f0ff)]" />
            <span>ISE Department Bulletin</span>
          </div>

          {/* Main Title */}
          <h1 className="font-clash font-bold text-4xl sm:text-5xl md:text-6xl tracking-tight text-[var(--theme-bg-hero,#dce6ef)]">
            NEXORA <span className="text-[var(--theme-primary,#00f0ff)]">NOTICEBOARD</span>
          </h1>

          {/* Subtitle */}
          <p className="mt-3 sm:mt-4 text-base sm:text-lg text-[var(--theme-primary,#00f0ff)]/80 max-w-2xl mx-auto leading-relaxed font-cabinet">
            Official announcements, team updates, and urgent alerts.
          </p>

          {/* Decorative Divider */}
          <div
            aria-hidden="true"
            className="mt-6 mx-auto h-[1px] w-32 sm:w-48 bg-gradient-to-r from-transparent via-[var(--theme-primary,#00f0ff)] to-transparent"
          />
        </section>

        {/* ========================================================================= */}
        {/* 2. PINNED / URGENT HERO CARD */}
        {/* ========================================================================= */}
        {showHeroBanner && heroNotice && (
          <section className="mb-10 sm:mb-12" aria-label="Urgent Announcement">
            <div className="relative overflow-hidden rounded-3xl border-2 border-rose-500/40 bg-gradient-to-br from-rose-950/30 via-[#0a0e1c] to-[#070b16] p-6 sm:p-8 backdrop-blur-xl shadow-[0_0_35px_rgba(244,63,94,0.2)] transition-all duration-300 hover:border-rose-500/70 hover:shadow-[0_0_45px_rgba(244,63,94,0.3)]">
              {/* Background ambient beacon glow */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-10 -top-10 h-64 w-64 rounded-full bg-rose-500/15 blur-[80px]"
              />

              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-3.5 flex-1">
                  {/* Badges Row */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* Live Urgency Pulse */}
                    <span className="inline-flex items-center gap-2 rounded-full border border-rose-500/40 bg-rose-500/20 px-3 py-1 text-xs font-bold text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.4)]">
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
                      </span>
                      <span>CRITICAL ANNOUNCEMENT</span>
                    </span>

                    <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-400/40 bg-sky-500/15 px-3 py-1 text-xs font-semibold text-sky-300 shadow-[0_0_10px_rgba(56,189,248,0.25)]">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="17" x2="12" y2="22" />
                        <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
                      </svg>
                      PINNED HERO
                    </span>

                    <span className="text-xs text-rose-200/60 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      {heroNotice.postedAt}
                    </span>
                  </div>

                  {/* Title */}
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight leading-snug drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                    {heroNotice.title}
                  </h2>

                  {/* Summary */}
                  <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-3xl">
                    {heroNotice.summary}
                  </p>

                  {/* Attachment and Author info */}
                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    {heroNotice.attachment && (
                      <a
                        href={heroNotice.attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl border border-rose-400/30 bg-rose-950/40 px-3.5 py-1.5 text-xs font-semibold text-rose-200 transition-colors hover:border-rose-400 hover:bg-rose-500/20 hover:text-white"
                      >
                        <AttachmentIcon type={heroNotice.attachment.type} />
                        <span>{heroNotice.attachment.name}</span>
                        {heroNotice.attachment.size && (
                          <span className="text-rose-300/60">({heroNotice.attachment.size})</span>
                        )}
                      </a>
                    )}

                    <span className="text-xs text-slate-400">
                      Issued by <strong className="text-slate-200 font-semibold">{heroNotice.author.name}</strong> ({heroNotice.author.role})
                    </span>
                  </div>
                </div>

                {/* Hero CTA Button */}
                <div className="shrink-0 flex sm:flex-col justify-end">
                  <button
                    type="button"
                    onClick={() => setSelectedNotice(heroNotice)}
                    aria-label={`View urgent announcement: ${heroNotice.title}`}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-400/50 bg-gradient-to-r from-rose-600 to-rose-500 px-6 py-3.5 text-sm font-bold text-white shadow-[0_0_20px_rgba(244,63,94,0.4)] transition-all duration-300 hover:from-rose-500 hover:to-rose-400 hover:shadow-[0_0_30px_rgba(244,63,94,0.6)] active:scale-95 cursor-pointer"
                  >
                    <span>Read Urgent Notice</span>
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* 3. INTERACTIVE CONTROLS BAR (Search, Filters, View Modes) */}
        {/* ========================================================================= */}
        <section className="mb-8 space-y-4">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            
            {/* Real-time Search Bar */}
            <div className="relative flex-1 max-w-xl">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-sky-400">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>

              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notices by keyword, title, tag, or author..."
                className="w-full rounded-2xl border border-sky-500/30 bg-[#070b16]/90 pl-11 pr-11 py-3 text-sm text-white placeholder-sky-200/40 backdrop-blur-md outline-none transition-all duration-200 focus:border-sky-400 focus:bg-[#0c1222] focus:shadow-[0_0_20px_rgba(56,189,248,0.3)]"
                aria-label="Search noticeboard announcements"
              />

              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search query"
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>

            {/* View Mode & Sort Controls */}
            <div className="flex items-center justify-between sm:justify-end gap-3">
              {/* Sort Order Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-sky-200/50 hidden sm:inline-block">Sort:</span>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as "newest" | "oldest")}
                  className="rounded-xl border border-sky-500/30 bg-[#070b16] px-3 py-2 text-xs font-medium text-sky-200 outline-none focus:border-sky-400 cursor-pointer"
                  aria-label="Sort notices by date"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
              </div>

              {/* Grid / List View Toggle */}
              <div className="flex items-center rounded-xl border border-sky-500/30 bg-[#070b16] p-1">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  aria-label="Grid layout view"
                  className={`rounded-lg p-1.5 transition-colors cursor-pointer ${
                    viewMode === "grid"
                      ? "bg-sky-500/20 text-sky-300 shadow-[0_0_10px_rgba(56,189,248,0.3)]"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="14" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  aria-label="List layout view"
                  className={`rounded-lg p-1.5 transition-colors cursor-pointer ${
                    viewMode === "list"
                      ? "bg-sky-500/20 text-sky-300 shadow-[0_0_10px_rgba(56,189,248,0.3)]"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="8" y1="6" x2="21" y2="6" />
                    <line x1="8" y1="12" x2="21" y2="12" />
                    <line x1="8" y1="18" x2="21" y2="18" />
                    <line x1="3" y1="6" x2="3.01" y2="6" />
                    <line x1="3" y1="12" x2="3.01" y2="12" />
                    <line x1="3" y1="18" x2="3.01" y2="18" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Category Filter Pills Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 scrollbar-none" role="tablist" aria-label="Notice categories">
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat;
              const count = categoryCounts[cat];

              // Custom category active styles
              let activeBadgeClass = "border-sky-400 bg-sky-500/25 text-white shadow-[0_0_16px_rgba(56,189,248,0.4)]";
              if (cat === "Urgent") {
                activeBadgeClass = "border-rose-400 bg-rose-500/25 text-white shadow-[0_0_16px_rgba(244,63,94,0.4)]";
              } else if (cat === "Projects") {
                activeBadgeClass = "border-sky-400 bg-sky-500/25 text-white shadow-[0_0_16px_rgba(56,189,248,0.4)]";
              } else if (cat === "Events") {
                activeBadgeClass = "border-emerald-400 bg-emerald-500/25 text-white shadow-[0_0_16px_rgba(16,185,129,0.4)]";
              } else if (cat === "General") {
                activeBadgeClass = "border-amber-400 bg-amber-500/25 text-white shadow-[0_0_16px_rgba(245,158,11,0.4)]";
              }

              return (
                <button
                  key={cat}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setSelectedCategory(cat)}
                  className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-xs sm:text-sm font-semibold transition-all duration-300 border cursor-pointer ${
                    isActive
                      ? activeBadgeClass
                      : "border-white/10 bg-white/[0.03] text-slate-300 hover:border-sky-400/40 hover:bg-sky-500/10 hover:text-white"
                  }`}
                >
                  {/* Category dot */}
                  {cat !== "All" && (
                    <span
                      className={`h-2 w-2 rounded-full ${
                        cat === "Urgent"
                          ? "bg-rose-400"
                          : cat === "Projects"
                          ? "bg-sky-400"
                          : cat === "Events"
                          ? "bg-emerald-400"
                          : "bg-amber-400"
                      }`}
                    />
                  )}
                  <span>{cat}</span>
                  <span
                    className={`rounded-full px-2 py-0.2 text-[11px] font-bold ${
                      isActive ? "bg-white/20 text-white" : "bg-white/10 text-slate-400"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Filter Summary Bar */}
          {(searchQuery || selectedCategory !== "All") && (
            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <p>
                Showing <strong className="text-white">{filteredNotices.length}</strong> {filteredNotices.length === 1 ? "notice" : "notices"}
                {selectedCategory !== "All" && (
                  <span> in category <strong className="text-sky-300">{selectedCategory}</strong></span>
                )}
                {searchQuery && (
                  <span> matching &ldquo;<strong className="text-sky-300">{searchQuery}</strong>&rdquo;</span>
                )}
              </p>

              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("All");
                }}
                className="text-sky-400 hover:underline cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </section>

        {/* ========================================================================= */}
        {/* 4. NOTICE FEED GRID / LIST */}
        {/* ========================================================================= */}
        {filteredNotices.length > 0 ? (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                : "flex flex-col gap-4"
            }
          >
            {filteredNotices.map((notice) => (
              <NoticeCard
                key={notice.id}
                notice={notice}
                onReadMore={(n) => setSelectedNotice(n)}
                viewMode={viewMode}
              />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="my-16 rounded-3xl border border-dashed border-sky-400/30 bg-[#070b16]/60 p-12 text-center backdrop-blur-md">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-sky-500/10 text-sky-400 mb-4 border border-sky-400/30 shadow-[0_0_15px_rgba(56,189,248,0.2)]">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white">No notices found</h3>
            <p className="mt-1 text-sm text-slate-400 max-w-sm mx-auto">
              We couldn&apos;t find any announcements matching your current filters. Try searching with different keywords or reset your filters.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All");
              }}
              className="mt-6 inline-flex items-center gap-2 rounded-xl border border-sky-400/40 bg-sky-500/20 px-5 py-2.5 text-xs font-semibold text-white shadow-[0_0_15px_rgba(56,189,248,0.3)] transition-all hover:bg-sky-500/30 cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 5. NOTICE DETAIL MODAL */}
      {/* ========================================================================= */}
      <NoticeModal
        notice={selectedNotice}
        onClose={closeNotice}
      />

      {/* Global Footer */}
      <Footer />
    </main>
  );
}