"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, type MouseEvent } from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { EventItem } from "@/lib/types";

const ease = [0.22, 1, 0.36, 1] as const;

function useMinuteClock(initialNow: number) {
  const [now, setNow] = useState(initialNow);

  useEffect(() => {
    const update = () => setNow(Date.now());
    const delay = 60_000 - (Date.now() % 60_000);
    let interval: number | undefined;
    const timeout = window.setTimeout(() => {
      update();
      interval = window.setInterval(update, 60_000);
    }, delay);

    update();
    return () => {
      window.clearTimeout(timeout);
      if (interval !== undefined) window.clearInterval(interval);
    };
  }, []);

  return now;
}

function sortEvents(events: EventItem[], now: number) {
  const upcoming: EventItem[] = [];
  const past: EventItem[] = [];

  for (const event of events) {
    const start = event.eventDate ? new Date(event.eventDate).getTime() : null;
    const end = event.endDate ? new Date(event.endDate).getTime() : start;
    if (end === null || end >= now) upcoming.push(event);
    else past.push(event);
  }

  upcoming.sort((a, b) => {
    const aStart = a.eventDate ? new Date(a.eventDate).getTime() : Number.MAX_SAFE_INTEGER;
    const bStart = b.eventDate ? new Date(b.eventDate).getTime() : Number.MAX_SAFE_INTEGER;
    return aStart - bStart;
  });
  past.sort((a, b) => new Date(b.endDate || b.eventDate || 0).getTime() - new Date(a.endDate || a.eventDate || 0).getTime());

  return { upcoming, past };
}

function formatDateParts(value: string | null) {
  if (!value) return { day: "TBA", month: "DATE" };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { day: "TBA", month: "DATE" };
  return {
    day: new Intl.DateTimeFormat("en", { day: "2-digit" }).format(date),
    month: new Intl.DateTimeFormat("en", { month: "short" }).format(date).toUpperCase(),
  };
}

function formatFullDate(value: string | null) {
  if (!value) return "Date to be announced";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date to be announced";
  return new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

function getStatus(event: EventItem, now: number) {
  const start = event.eventDate ? new Date(event.eventDate).getTime() : null;
  const end = event.endDate ? new Date(event.endDate).getTime() : start;
  const deadline = event.registrationDeadline ? new Date(event.registrationDeadline).getTime() : null;

  if (start !== null && end !== null && start <= now && end >= now) return "LIVE";
  if (end !== null && end < now) return "CLOSED";
  if (!event.registrationOpen || (deadline !== null && deadline < now)) return "CLOSED";
  return "OPEN";
}

function Countdown({ event, now }: { event: EventItem; now: number }) {
  const target = event.eventDate ? new Date(event.eventDate).getTime() : null;
  if (target === null || Number.isNaN(target)) {
    return <p className="home-event-countdown">COUNTDOWN · DATE TBA</p>;
  }

  if (target <= now) {
    return <p className="home-event-countdown">EVENT · IN PROGRESS</p>;
  }

  const totalMinutes = Math.floor((target - now) / 60_000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  return (
    <p className="home-event-countdown" aria-label={`${days} days, ${hours} hours, ${minutes} minutes until ${event.title}`}>
      <span aria-hidden="true">T-MINUS</span>
      <span className="home-event-countdown-digits" aria-hidden="true">
        <RollingNumber value={days} label="days" />
        <i>:</i>
        <RollingNumber value={hours} label="hours" />
        <i>:</i>
        <RollingNumber value={minutes} label="minutes" />
      </span>
    </p>
  );
}

function RollingNumber({ value, label }: { value: number; label: string }) {
  const reducedMotion = useReducedMotion();
  const display = String(value).padStart(2, "0");

  return (
    <span className="home-event-roll" aria-label={`${value} ${label}`}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={display}
          initial={reducedMotion ? false : { y: "65%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          exit={reducedMotion ? undefined : { y: "-65%", opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.22, ease }}
        >
          {display}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function StatusTag({ event, now }: { event: EventItem; now: number }) {
  const status = getStatus(event, now);
  return (
    <span className={`home-event-status home-event-status--${status.toLowerCase()}`}>
      {status === "LIVE" && <i aria-hidden="true" />}
      {status}
    </span>
  );
}

function EventAction({ event }: { event: EventItem }) {
  const className = "home-event-action";
  if (event.registrationUrl) {
    return (
      <a className={className} href={event.registrationUrl} target="_blank" rel="noreferrer">
        Register <ArrowUpRight size={14} aria-hidden="true" />
      </a>
    );
  }
  return (
    <Link className={className} href="/events">
      View details <ArrowRight size={14} aria-hidden="true" />
    </Link>
  );
}

function FeaturedTicket({ event, now }: { event: EventItem; now: number }) {
  const date = formatDateParts(event.eventDate);
  return (
    <article className="home-events-ticket-card home-events-ticket-card--featured">
      <div className="home-event-ticket-date-stub" aria-label={formatFullDate(event.eventDate)}>
        <span className={date.day === "TBA" ? "home-event-date-tba" : undefined}>{date.day}</span>
        <small>{date.month}</small>
      </div>
      <div className="home-event-ticket-body">
        <div className="home-event-ticket-topline">
          <span className="home-event-notch-tag">{event.category}</span>
          <StatusTag event={event} now={now} />
        </div>
        <h3>{event.title}</h3>
        <p className="home-event-venue">{event.venueDisplay || event.venue || "Venue to be announced"}</p>
        <p className="home-event-description">{event.description}</p>
        <div className="home-event-ticket-footer">
          <Countdown event={event} now={now} />
          <EventAction event={event} />
        </div>
      </div>
    </article>
  );
}

function CompactTicket({ event, now }: { event: EventItem; now: number }) {
  const date = formatDateParts(event.eventDate);
  return (
    <article className="home-events-ticket-card home-events-ticket-card--compact">
      <div className="home-event-ticket-date-stub" aria-label={formatFullDate(event.eventDate)}>
        <span className={date.day === "TBA" ? "home-event-date-tba" : undefined}>{date.day}</span>
        <small>{date.month}</small>
      </div>
      <div className="home-event-ticket-body">
        <div className="home-event-ticket-topline">
          <span className="home-event-notch-tag">{event.category}</span>
          <StatusTag event={event} now={now} />
        </div>
        <h3>{event.title}</h3>
        <p className="home-event-venue">{event.venueDisplay || event.venue || "Venue to be announced"}</p>
        <EventAction event={event} />
      </div>
    </article>
  );
}

function PastEvents({ events }: { events: EventItem[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pointer, setPointer] = useState({ x: -1000, y: -1000 });
  const reducedMotion = useReducedMotion();
  const activeEvent = events.find((event) => event.id === activeId && event.imageUrl);

  const updatePointer = (event: MouseEvent<HTMLButtonElement>) => {
    setPointer({
      x: Math.max(8, Math.min(event.clientX + 20, window.innerWidth - 200)),
      y: Math.max(8, Math.min(event.clientY + 20, window.innerHeight - 250)),
    });
  };

  if (events.length === 0) return null;

  return (
    <div className="home-events-previous">
      <div className="home-events-previous-heading">
        <span className="home-event-notch-tag">Previously</span>
        <span>{String(Math.min(events.length, 4)).padStart(2, "0")} ARCHIVED</span>
      </div>
      <div className="home-events-previous-list">
        {events.slice(0, 4).map((event) => (
          <button
            className="home-events-previous-row"
            key={event.id}
            type="button"
            onMouseEnter={() => setActiveId(event.id)}
            onMouseMove={updatePointer}
            onMouseLeave={() => setActiveId(null)}
            onFocus={() => setActiveId(event.id)}
            onBlur={() => setActiveId(null)}
            aria-label={`${formatFullDate(event.eventDate)}: ${event.title}, ${event.category}`}
          >
            {activeId === event.id && (
              <motion.span
                className="home-events-row-highlight"
                layoutId="home-events-row-highlight"
                transition={reducedMotion ? { duration: 0 } : { duration: 0.28, ease }}
                aria-hidden="true"
              />
            )}
            <span className="home-events-row-date">{formatFullDate(event.eventDate)}</span>
            <strong>{event.title}</strong>
            <span className="home-events-row-category">{event.category}</span>
          </button>
        ))}
      </div>
      {activeEvent?.imageUrl && (
        <motion.div
          className="home-events-poster-preview"
          aria-hidden="true"
          initial={reducedMotion ? false : { opacity: 0, scale: 0.96 }}
          animate={{ opacity: pointer.x >= 0 ? 1 : 0, scale: 1, left: pointer.x, top: pointer.y }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.16 }}
        >
          <Image src={activeEvent.imageUrl} alt="" fill sizes="180px" unoptimized />
        </motion.div>
      )}
    </div>
  );
}

export default function HomeEventsSection({
  events,
  initialNow,
}: {
  events: EventItem[]
  initialNow: number
}) {
  const now = useMinuteClock(initialNow);
  const reducedMotion = useReducedMotion();
  const { upcoming, past } = useMemo(() => sortEvents(events, now), [events, now]);
  const featured = upcoming[0];
  const secondary = upcoming.slice(1, 3);

  const sectionVariants = {
    hidden: reducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 22 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: reducedMotion ? 0 : 0.72, ease, staggerChildren: 0.08 },
    },
  };
  const ticketVariants = {
    hidden: reducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: reducedMotion ? 0 : 0.68, ease } },
  };

  return (
    <motion.section
      className="home-events-section"
      aria-labelledby="home-events-heading"
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.12 }}
    >
      <header className="home-events-header">
        <p className="home-events-kicker">NEXORA · EVENTS</p>
        <h2 id="home-events-heading">
          Things happening <span>soon.</span>
        </h2>
        <p>Hackathons, workshops, competitions and exhibitions from the department.</p>
      </header>

      {featured ? (
        <div className={`home-events-ticket-layout${upcoming.length === 1 ? " home-events-ticket-layout--single" : ""}`}>
          <motion.div variants={ticketVariants}>
            <FeaturedTicket event={featured} now={now} />
          </motion.div>
          {secondary.length > 0 && (
            <div className="home-events-secondary">
              {secondary.map((event) => (
                <motion.div key={event.id} variants={ticketVariants}>
                  <CompactTicket event={event} now={now} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <motion.div className="home-events-empty" variants={ticketVariants}>
          <strong>No events scheduled</strong>
          <code>&gt; check back soon_</code>
          <Link href="/events#past-events">Browse past events <ArrowRight size={15} aria-hidden="true" /></Link>
        </motion.div>
      )}

      <PastEvents events={past} />

      <div className="home-events-footer">
        <Link href="/events">
          All events <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </motion.section>
  );
}
