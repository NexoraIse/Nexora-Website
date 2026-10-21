"use client";

import { useEffect, useRef, useState, useCallback, useId } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Maximize2,
  Pause,
  Play,
  Calendar,
  MapPin,
  Tag,
} from "lucide-react";
import {
  GALLERY_ROWS,
  ALL_GALLERY_ITEMS,
  type GalleryItem,
} from "@/lib/home-gallery";

interface GalleryRowProps {
  items: GalleryItem[];
  direction: "left" | "right";
  durationSeconds: number;
  rowHeightClass: string;
  isPaused: boolean;
  onSelectPhoto: (id: string) => void;
  reducedMotion: boolean;
  rowIndex: number;
}

function GalleryRow({
  items,
  direction,
  durationSeconds,
  rowHeightClass,
  isPaused,
  onSelectPhoto,
  reducedMotion,
  rowIndex,
}: GalleryRowProps) {
  if (!items || items.length === 0) return null;

  const displayItems =
    items.length < 5
      ? Array.from({ length: Math.ceil(5 / items.length) }, () => items).flat()
      : items;

  const rowAriaLabel = `Gallery row ${rowIndex + 1}, moving ${direction === "left" ? "right to left" : "left to right"}`;

  return (
    <div
      className={`home-gallery-row relative w-full overflow-hidden ${rowHeightClass} group/row`}
      aria-label={rowAriaLabel}
    >
      <div
        className={`home-gallery-track flex w-max h-full items-center ${
          direction === "left"
            ? "animate-gallery-left"
            : "animate-gallery-right"
        }`}
        style={{
          animationDuration: `${durationSeconds}s`,
          animationPlayState: isPaused || reducedMotion ? "paused" : "running",
        }}
      >
        {/* Sequence 1 */}
        <div className="flex h-full items-center gap-3 sm:gap-4 shrink-0 pr-3 sm:pr-4">
          {displayItems.map((item, idx) => (
            <GalleryCard
              key={`${item.id}-a-${idx}`}
              item={item}
              rowHeightClass={rowHeightClass}
              onSelect={() => onSelectPhoto(item.id)}
            />
          ))}
        </div>

        {/* Sequence 2 (seamless infinite loop mirror) */}
        <div
          className="flex h-full items-center gap-3 sm:gap-4 shrink-0 pr-3 sm:pr-4"
          aria-hidden="true"
        >
          {displayItems.map((item, idx) => (
            <GalleryCard
              key={`${item.id}-b-${idx}`}
              item={item}
              rowHeightClass={rowHeightClass}
              onSelect={() => onSelectPhoto(item.id)}
              isDuplicate
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function GalleryCard({
  item,
  rowHeightClass,
  onSelect,
  isDuplicate = false,
}: {
  item: GalleryItem;
  rowHeightClass: string;
  onSelect: () => void;
  isDuplicate?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      tabIndex={isDuplicate ? -1 : 0}
      aria-label={`View photo: ${item.title} (${item.category})`}
      className={`relative h-full ${item.aspectRatio} shrink-0 overflow-hidden rounded-lg md:rounded-xl bg-[#070e1b] border border-cyan-500/15 text-left transition-all duration-300 hover:border-cyan-400/60 hover:shadow-[0_0_24px_rgba(0,240,255,0.22)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00f0ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#060913] group/card`}
    >
      {/* Background image */}
      <img
        src={item.src}
        alt={item.alt}
        loading="lazy"
        decoding="async"
        className="w-full h-full object-cover select-none transition-transform duration-500 will-change-transform group-hover/card:scale-[1.04]"
      />

      {/* Subtle darkening overlay with tech grid hint */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-60 group-hover/card:opacity-90 transition-opacity duration-300 pointer-events-none" />

      {/* Top Tag badge */}
      <div className="absolute top-2.5 left-2.5 opacity-90 transition-opacity duration-300 pointer-events-none">
        <span className="inline-flex items-center gap-1 rounded-full bg-[#020814]/80 px-2 py-0.5 text-[9px] sm:text-[10px] font-mono tracking-wider font-semibold text-[#00f0ff] border border-[#00f0ff]/30 backdrop-blur-sm">
          {item.category}
        </span>
      </div>

      {/* Hover zoom indicator */}
      <div className="absolute top-2.5 right-2.5 opacity-0 group-hover/card:opacity-100 transition-opacity duration-200 pointer-events-none">
        <div className="w-6 h-6 rounded-md bg-[#020814]/90 border border-cyan-400/50 flex items-center justify-center text-[#00f0ff]">
          <Maximize2 size={12} aria-hidden="true" />
        </div>
      </div>

      {/* Bottom info on hover */}
      <div className="absolute inset-x-0 bottom-0 p-2.5 sm:p-3 translate-y-1 group-hover/card:translate-y-0 transition-transform duration-300 pointer-events-none">
        <p className="font-sans text-xs sm:text-sm font-semibold text-white tracking-tight line-clamp-1 group-hover/card:text-[#00f0ff] transition-colors duration-200">
          {item.title}
        </p>
        <p className="text-[10px] sm:text-[11px] font-mono text-slate-400 line-clamp-1 mt-0.5 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300">
          {item.date} {item.location ? `· ${item.location}` : ""}
        </p>
      </div>
    </button>
  );
}

export default function HomeGallerySection() {
  const [rows, setRows] = useState<GalleryItem[][]>(GALLERY_ROWS);
  const [allItems, setAllItems] = useState<GalleryItem[]>(ALL_GALLERY_ITEMS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [userPaused, setUserPaused] = useState<boolean>(false);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const systemPrefersReducedMotion = useReducedMotion();
  const headingId = useId();
  const lightboxRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  const reducedMotion = Boolean(systemPrefersReducedMotion);
  const isAnimationPaused = userPaused || isHovered;

  // Sync with dynamic gallery additions (e.g. added via Admin Dashboard)
  useEffect(() => {
    let isMounted = true;
    async function loadDynamicGallery() {
      try {
        const res = await fetch('/api/gallery', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data.rows) && Array.isArray(data.all) && data.all.length > 0) {
            setRows(data.rows);
            setAllItems(data.all);
          }
        }
      } catch {
        // Fall back gracefully to seeded rows
      }
    }
    loadDynamicGallery();
    return () => {
      isMounted = false;
    };
  }, []);

  // Selected item index in flattened gallery
  const selectedIndex = selectedId
    ? allItems.findIndex((it) => it.id === selectedId)
    : -1;
  const activeItem = selectedIndex >= 0 ? allItems[selectedIndex] : null;

  const handleOpenPhoto = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedId(null);
  }, []);

  const handlePrev = useCallback(() => {
    if (selectedIndex === -1 || allItems.length === 0) return;
    const prevIdx =
      (selectedIndex - 1 + allItems.length) % allItems.length;
    setSelectedId(allItems[prevIdx].id);
  }, [selectedIndex, allItems]);

  const handleNext = useCallback(() => {
    if (selectedIndex === -1 || allItems.length === 0) return;
    const nextIdx = (selectedIndex + 1) % allItems.length;
    setSelectedId(allItems[nextIdx].id);
  }, [selectedIndex, allItems]);

  // Lock background scroll when lightbox is active
  useEffect(() => {
    if (activeItem) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      // Auto-focus close button on modal open
      closeBtnRef.current?.focus();
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [activeItem]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!activeItem) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeItem, handleClose, handlePrev, handleNext]);

  return (
    <section
      className="home-gallery-section relative w-full overflow-x-hidden pt-16 md:pt-24 pb-20 md:pb-28 text-slate-200"
      aria-labelledby={headingId}
    >
      {/* Scoped CSS keyframes for seamless GPU-accelerated marquee */}
      <style jsx global>{`
        @keyframes galleryMarqueeLeft {
          0% {
            transform: translate3d(0, 0, 0);
          }
          100% {
            transform: translate3d(-50%, 0, 0);
          }
        }
        @keyframes galleryMarqueeRight {
          0% {
            transform: translate3d(-50%, 0, 0);
          }
          100% {
            transform: translate3d(0, 0, 0);
          }
        }
        .animate-gallery-left {
          animation-name: galleryMarqueeLeft;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          will-change: transform;
        }
        .animate-gallery-right {
          animation-name: galleryMarqueeRight;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          will-change: transform;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-gallery-left,
          .animate-gallery-right {
            animation: none !important;
          }
          .home-gallery-row {
            overflow-x: auto !important;
            scroll-behavior: smooth;
          }
        }
      `}</style>

      {/* Header Container - aligned with existing homepage section headers */}
      <div className="relative mx-auto mb-8 w-[min(calc(100%-2rem),80rem)] sm:mb-10 sm:w-[min(calc(100%-3rem),80rem)] md:w-[min(calc(100%-8rem),80rem)] lg:w-[min(calc(100%-12rem),80rem)] xl:w-[min(calc(100%-16rem),80rem)]">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <header className="max-w-2xl">
            <p className="text-[10px] font-mono font-semibold tracking-[0.2em] text-[#00f0ff] uppercase">
              NEXORA · GALLERY
            </p>
            <h2
              id={headingId}
              className="mt-2.5 font-sans text-[clamp(2.25rem,5vw,4.2rem)] font-bold tracking-[-0.02em] leading-[1.04] text-[#e2e8f0]"
              style={{ fontFamily: "var(--font-clash-display), sans-serif" }}
            >
              Moments that <span className="text-[#00f0ff]">make us.</span>
            </h2>
            <p
              className="mt-3 text-sm leading-[1.65] text-[#94a3b8]"
              style={{ fontFamily: "var(--font-cabinet-grotesk), sans-serif" }}
            >
              A glimpse into our workshops, technical events, competitions,
              collaborations, and the community we&apos;re building.
            </p>
          </header>

          {/* Interactive Play/Pause & Counter Widget */}
          <div className="flex items-center gap-3 self-start md:self-end shrink-0">
            <span className="text-xs font-mono text-slate-400 hidden sm:inline-block">
              {allItems.length} MOMENTS ARCHIVED
            </span>
            <button
              type="button"
              onClick={() => setUserPaused((prev) => !prev)}
              aria-label={
                userPaused ? "Resume gallery animation" : "Pause gallery animation"
              }
              aria-pressed={userPaused}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#081324] border border-cyan-500/25 text-[#00f0ff] text-xs font-mono hover:border-cyan-400 hover:bg-[#0c1c36] transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00f0ff]"
            >
              {userPaused ? (
                <>
                  <Play size={12} fill="currentColor" aria-hidden="true" />
                  <span>RESUME</span>
                </>
              ) : (
                <>
                  <Pause size={12} fill="currentColor" aria-hidden="true" />
                  <span>PAUSE</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Empty State or Infinite Moving Rows */}
      {allItems.length === 0 ? (
        <div className="relative mx-auto w-[min(calc(100%-2rem),80rem)] py-14 px-6 text-center rounded-2xl border border-cyan-500/15 bg-[#030814]/40 backdrop-blur-sm">
          <p className="text-sm font-mono text-slate-400">
            Moments will appear here as photos are added to the gallery.
          </p>
        </div>
      ) : (
        <div
          className="relative w-full overflow-hidden space-y-3 sm:space-y-4 py-2"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{
            maskImage:
              "linear-gradient(to right, transparent, black 3%, black 97%, transparent)",
            WebkitMaskImage:
              "linear-gradient(to right, transparent, black 3%, black 97%, transparent)",
          }}
        >
          {/* ROW 1: Right to Left */}
          <GalleryRow
            rowIndex={0}
            items={rows[0] || []}
            direction="left"
            durationSeconds={42}
            rowHeightClass="h-36 sm:h-44 md:h-48 lg:h-52"
            isPaused={isAnimationPaused}
            onSelectPhoto={handleOpenPhoto}
            reducedMotion={reducedMotion}
          />

          {/* ROW 2: Left to Right */}
          <GalleryRow
            rowIndex={1}
            items={rows[1] || []}
            direction="right"
            durationSeconds={54}
            rowHeightClass="h-40 sm:h-48 md:h-52 lg:h-56"
            isPaused={isAnimationPaused}
            onSelectPhoto={handleOpenPhoto}
            reducedMotion={reducedMotion}
          />

          {/* ROW 3: Right to Left */}
          <GalleryRow
            rowIndex={2}
            items={rows[2] || []}
            direction="left"
            durationSeconds={38}
            rowHeightClass="h-32 sm:h-40 md:h-44 lg:h-48"
            isPaused={isAnimationPaused}
            onSelectPhoto={handleOpenPhoto}
            reducedMotion={reducedMotion}
          />

          {/* ROW 4: Left to Right */}
          <GalleryRow
            rowIndex={3}
            items={rows[3] || []}
            direction="right"
            durationSeconds={48}
            rowHeightClass="h-36 sm:h-44 md:h-48 lg:h-52"
            isPaused={isAnimationPaused}
            onSelectPhoto={handleOpenPhoto}
            reducedMotion={reducedMotion}
          />
        </div>
      )}

      {/* Interactive Lightbox Modal */}
      <AnimatePresence>
        {activeItem && (
          <motion.div
            ref={lightboxRef}
            role="dialog"
            aria-modal="true"
            aria-label={`Photo viewer: ${activeItem.title}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={handleClose}
            className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 md:p-10 bg-black/85 backdrop-blur-md"
          >
            {/* Modal Card */}
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 12 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="relative flex flex-col max-w-5xl w-full max-h-[92vh] overflow-hidden rounded-2xl bg-[#050b16] border border-cyan-500/30 shadow-[0_0_50px_rgba(0,240,255,0.18)]"
            >
              {/* Modal Top Header bar */}
              <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-cyan-500/15 bg-[#030710]/90">
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#00f0ff]/10 px-2.5 py-0.5 text-xs font-mono font-semibold text-[#00f0ff] border border-[#00f0ff]/30">
                    <Tag size={11} aria-hidden="true" />
                    {activeItem.category}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    {String(selectedIndex + 1).padStart(2, "0")} /{" "}
                    {String(allItems.length).padStart(2, "0")}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-slate-400 hidden sm:inline-block">
                    ESC to close · ← → to navigate
                  </span>
                  <button
                    ref={closeBtnRef}
                    type="button"
                    onClick={handleClose}
                    aria-label="Close photo preview (Escape)"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00f0ff]"
                  >
                    <X size={18} aria-hidden="true" />
                  </button>
                </div>
              </div>

              {/* Main Photo View Area */}
              <div className="relative flex-1 min-h-0 flex items-center justify-center p-3 sm:p-6 bg-[#02050b]">
                <img
                  src={activeItem.src}
                  alt={activeItem.alt}
                  className="max-h-[58vh] md:max-h-[64vh] w-auto max-w-full object-contain rounded-lg shadow-2xl border border-white/5"
                />

                {/* Previous Button */}
                <button
                  type="button"
                  onClick={handlePrev}
                  aria-label="Previous photo (Left arrow)"
                  className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 p-2 sm:p-3 rounded-full bg-[#030814]/85 border border-cyan-500/30 text-white hover:text-[#00f0ff] hover:bg-[#081428] hover:border-cyan-400 transition-all shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00f0ff]"
                >
                  <ChevronLeft size={22} aria-hidden="true" />
                </button>

                {/* Next Button */}
                <button
                  type="button"
                  onClick={handleNext}
                  aria-label="Next photo (Right arrow)"
                  className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 p-2 sm:p-3 rounded-full bg-[#030814]/85 border border-cyan-500/30 text-white hover:text-[#00f0ff] hover:bg-[#081428] hover:border-cyan-400 transition-all shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00f0ff]"
                >
                  <ChevronRight size={22} aria-hidden="true" />
                </button>
              </div>

              {/* Bottom Caption & Meta Footer */}
              <div className="px-4 sm:px-6 py-4 border-t border-cyan-500/15 bg-[#030710]/95">
                <h3
                  className="text-lg sm:text-xl font-bold text-white tracking-tight"
                  style={{
                    fontFamily: "var(--font-clash-display), sans-serif",
                  }}
                >
                  {activeItem.title}
                </h3>
                <p
                  className="mt-1 text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl"
                  style={{
                    fontFamily: "var(--font-cabinet-grotesk), sans-serif",
                  }}
                >
                  {activeItem.caption}
                </p>
                <div className="mt-2.5 flex flex-wrap items-center gap-4 text-xs font-mono text-cyan-400/90">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar size={13} aria-hidden="true" />
                    {activeItem.date}
                  </span>
                  {activeItem.location && (
                    <span className="inline-flex items-center gap-1.5 text-slate-400">
                      <MapPin size={13} aria-hidden="true" />
                      {activeItem.location}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
