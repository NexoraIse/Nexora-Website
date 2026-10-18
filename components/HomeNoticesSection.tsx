"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { NoticeCategory } from "@/lib/types";
import type { HomepageNotice } from "@/lib/home-notices";

type Filter = "ALL" | "URGENT" | "EVENT" | "PROJECT" | "GENERAL";

const FILTERS: Filter[] = ["ALL", "URGENT", "EVENT", "PROJECT", "GENERAL"];
const FILTER_CATEGORY: Partial<Record<Filter, NoticeCategory>> = {
  URGENT: "Urgent",
  EVENT: "Events",
  PROJECT: "Projects",
  GENERAL: "General",
};
const ease = [0.22, 1, 0.36, 1] as const;

function formatNoticeDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "DATE TBA";
  return new Intl.DateTimeFormat("en", { day: "2-digit", month: "short" })
    .format(date)
    .toUpperCase();
}

function getNoticeHref(notice: HomepageNotice) {
  return `/notices?notice=${encodeURIComponent(notice.id)}`;
}

function NoticeTicker({ notice }: { notice: HomepageNotice }) {
  return (
    <div className="home-notices-ticker" aria-label={`Urgent notice: ${notice.title}`}>
      <span className="home-notices-ticker-label">URGENT</span>
      <div className="home-notices-ticker-window">
        <div className="home-notices-ticker-track">
          <span>{notice.title}</span>
          <span aria-hidden="true">{notice.title}</span>
        </div>
      </div>
      <Link href={getNoticeHref(notice)} aria-label={`Read urgent notice: ${notice.title}`}>
        <ArrowUpRight size={14} aria-hidden="true" />
      </Link>
    </div>
  );
}

function NoticeRow({
  notice,
  index,
  hasEntered,
  typedNoticeId,
  typedTitle,
  reducedMotion,
}: {
  notice: HomepageNotice;
  index: number;
  hasEntered: boolean;
  typedNoticeId: string | null;
  typedTitle: string;
  reducedMotion: boolean | null;
}) {
  const isTyping = hasEntered && index === 0 && typedNoticeId === notice.id;

  return (
    <motion.div
      className={`home-notices-row${notice.priority === "URGENT" ? " home-notices-row--urgent" : ""}`}
      layout
      variants={{
        hidden: reducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 },
        visible: { opacity: 1, y: 0 },
      }}
      exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
      transition={{ duration: reducedMotion ? 0 : 0.45, ease }}
    >
      {notice.priority === "URGENT" && <span className="home-notices-urgent-dot" aria-hidden="true" />}
      <Link className="home-notices-row-link" href={getNoticeHref(notice)}>
        <time className="home-notices-date" dateTime={notice.date}>{formatNoticeDate(notice.date)}</time>
        <span className={`home-notices-type home-notices-type--${notice.category.toLowerCase()}`}>
          {notice.category}
        </span>
        <span className="home-notices-title">
          {isTyping ? <span aria-label={notice.title}>{typedTitle}</span> : notice.title}
        </span>
        <ArrowRight className="home-notices-row-arrow" size={16} aria-hidden="true" />
      </Link>
    </motion.div>
  );
}

export default function HomeNoticesSection({
  notices,
  newThisWeek,
  urgentCount,
  unavailable,
}: {
  notices: HomepageNotice[];
  newThisWeek: number;
  urgentCount: number;
  unavailable: boolean;
}) {
  const reducedMotion = useReducedMotion();
  const enteredRef = useRef(false);
  const typingStartedRef = useRef(false);
  const [hasEntered, setHasEntered] = useState(false);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [typingTarget, setTypingTarget] = useState<HomepageNotice | null>(null);
  const [typedNoticeId, setTypedNoticeId] = useState<string | null>(null);
  const [typedTitle, setTypedTitle] = useState("");

  const filteredNotices = useMemo(
    () => notices.filter((notice) => {
      if (filter === "ALL") return true;
      if (filter === "URGENT") return notice.priority === "URGENT";
      return notice.category === FILTER_CATEGORY[filter];
    }),
    [filter, notices],
  );

  function onEnterView() {
    if (enteredRef.current) return;
    enteredRef.current = true;
    setTypingTarget(filteredNotices[0] ?? null);
    setHasEntered(true);
  }

  useEffect(() => {
    if (!hasEntered || typingStartedRef.current || !typingTarget || reducedMotion) return;

    let index = 0;
    let interval: number | undefined;
    const startTimeout = window.setTimeout(() => {
      typingStartedRef.current = true;
      setTypedNoticeId(typingTarget.id);
      interval = window.setInterval(() => {
        index += 1;
        setTypedTitle(typingTarget.title.slice(0, index));
        if (index >= typingTarget.title.length) window.clearInterval(interval);
      }, 24);
    }, 0);

    return () => {
      window.clearTimeout(startTimeout);
      if (interval !== undefined) window.clearInterval(interval);
    };
  }, [hasEntered, reducedMotion, typingTarget]);

  const urgentNotice = notices.find((notice) => notice.priority === "URGENT");
  const sectionVariants = {
    hidden: reducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: reducedMotion ? 0 : 0.72, ease, staggerChildren: 0.08 },
    },
  };
  const listVariants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: reducedMotion ? 0 : 0.08 },
    },
  };

  return (
    <motion.section
      className="home-notices-section"
      aria-labelledby="home-notices-heading"
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      onViewportEnter={onEnterView}
      viewport={{ once: true, amount: 0.12 }}
    >
      <div className="home-notices-container">
        {urgentNotice && <NoticeTicker notice={urgentNotice} />}
        <div className="home-notices-window-pattern" aria-hidden="true" />
        <div className="home-notices-content">
          <div className="home-notices-intro">
            <header className="home-notices-header">
              <p className="home-notices-kicker">NEXORA · NOTICES</p>
              <h2 id="home-notices-heading">
                Don&apos;t miss <span>what&apos;s new.</span>
              </h2>
              <p>Latest announcements from the department and the club.</p>
            </header>
            <div className="home-notices-summary" aria-live="polite">
              <span>{newThisWeek} new this week</span>
              <span>{urgentCount} urgent</span>
            </div>
            <div className="home-notices-filters" role="group" aria-label="Filter notices">
              {FILTERS.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`home-notices-filter${filter === item ? " is-active" : ""}`}
                  aria-pressed={filter === item}
                  onClick={() => setFilter(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <motion.div
            className="home-notices-list"
            aria-live="polite"
            variants={listVariants}
            initial="hidden"
            animate={hasEntered ? "visible" : "hidden"}
          >
            <AnimatePresence initial={false} mode="popLayout">
              {unavailable ? (
                <motion.p
                  key="unavailable"
                  className="home-notices-empty"
                  role="status"
                  exit={reducedMotion ? { opacity: 1 } : { opacity: 0 }}
                >
                  Notices are temporarily unavailable
                </motion.p>
              ) : filteredNotices.length > 0 ? (
                filteredNotices.map((notice, index) => (
                  <NoticeRow
                    key={notice.id}
                    notice={notice}
                    index={index}
                    hasEntered={hasEntered}
                    typedNoticeId={typedNoticeId}
                    typedTitle={typedTitle}
                    reducedMotion={Boolean(reducedMotion)}
                  />
                ))
              ) : (
                <motion.p
                  key={`empty-${filter}`}
                  className="home-notices-empty"
                  initial={reducedMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={reducedMotion ? { opacity: 1 } : { opacity: 0 }}
                >
                  No notices right now
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
        <div className="home-notices-footer">
          <Link href="/notices">All notices <ArrowRight size={16} aria-hidden="true" /></Link>
        </div>
      </div>
    </motion.section>
  );
}
