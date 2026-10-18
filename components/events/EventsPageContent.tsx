'use client';

import React, { useState, useMemo } from 'react';
import { SearchX, RefreshCcw } from 'lucide-react';
import EventHero from './EventHero';
import EventFilters from './EventFilters';
import EventCard from './EventCard';
import EventModal from './EventModal';
import RegistrationModal from './RegistrationModal';
import PastEventsSection from './PastEventsSection';
import CtaSection from './CtaSection';
import type { EventCategory, EventItem } from '@/lib/types';
import { filterEvents } from '@/lib/events-data';

type EventApiItem = {
  id: string;
  title: string;
  slug: string;
  category: EventCategory;
  description: string;
  fullDescription: string | null;
  imageUrl: string | null;
  iconName: EventItem['iconName'] | null;
  startDate: string | null;
  endDate: string | null;
  registrationDeadline: string | null;
  dateDisplay: string | null;
  venue: string | null;
  venueDisplay: string | null;
  registrationOpen: boolean;
  registrationUrl: string | null;
  eligibility: string | null;
  organizer: string | null;
  tags: string[];
};

interface EventsPageContentProps {
  initialEvents: EventItem[];
}

export default function EventsPageContent({ initialEvents }: EventsPageContentProps) {
  const [eventsList, setEventsList] = useState<EventItem[]>(initialEvents);
  // State for search and filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<EventCategory | 'All Events'>('All Events');

  // Modals state
  const [detailsEvent, setDetailsEvent] = useState<EventItem | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const [registerEvent, setRegisterEvent] = useState<EventItem | null>(null);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  // Hydrate events dynamically from PostgreSQL database via API
  React.useEffect(() => {
    fetch('/api/events')
      .then((res) => res.json())
      .then((data: { events?: EventApiItem[] }) => {
        if (data.events && data.events.length > 0) {
          const mapped: EventItem[] = data.events.map((e) => ({
            id: e.id,
            title: e.title,
            slug: e.slug,
            category: e.category,
            description: e.description,
            fullDescription: e.fullDescription || e.description,
            imageUrl: e.imageUrl || '/events/code-wars.svg',
            iconName: e.iconName || 'Code',
            eventDate: e.startDate || null,
            endDate: e.endDate || null,
            registrationDeadline: e.registrationDeadline || null,
            dateDisplay: e.dateDisplay || 'To be announced (TBA)',
            startTime: e.startDate ? new Date(e.startDate).toLocaleTimeString() : null,
            endTime: e.endDate ? new Date(e.endDate).toLocaleTimeString() : null,
            venue: e.venue || null,
            venueDisplay: e.venueDisplay || 'Campus Tech Hub (TBA)',
            status: 'upcoming',
            registrationOpen: e.registrationOpen,
            registrationUrl: e.registrationUrl || null,
            eligibility: e.eligibility || 'Open to all students',
            organizer: e.organizer || 'Nexora ISE Club',
            tags: e.tags || [],
            isSample: false,
          }));
          setEventsList(mapped);
        }
      })
      .catch(() => {});
  }, []);

  // Filter events client-side using single source of truth logic
  const filteredEvents = useMemo(() => {
    return filterEvents(eventsList, selectedCategory, searchQuery);
  }, [eventsList, selectedCategory, searchQuery]);

  const handleOpenDetails = (event: EventItem) => {
    setDetailsEvent(event);
    setIsDetailsOpen(true);
  };

  const handleOpenRegister = (event: EventItem) => {
    setRegisterEvent(event);
    setIsRegisterOpen(true);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All Events');
  };

  return (
    <div className="relative w-full">
      {/* 1. Hero Section */}
      <EventHero />

      {/* 2. Main Events Grid Section */}
      <section id="events-grid" className="relative mx-auto max-w-7xl px-4 pt-28 pb-16 sm:px-6 lg:px-8">
        {/* Section Heading & Subtitle */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <p className="font-terminal text-xs tracking-[0.25em] uppercase text-[var(--theme-primary,#00f0ff)]">
                ACTIVE TRACKS &amp; COMPETITIONS
              </p>
              <h2 className="mt-1 text-2xl sm:text-3xl md:text-4xl font-clash font-bold tracking-tight text-[var(--theme-bg-hero,#dce6ef)]">
                Featured Department Events
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[var(--theme-primary,#00f0ff)]/70 max-w-md font-cabinet">
              Choose your track, connect with mentors, and collaborate on cutting-edge engineering projects.
            </p>
          </div>

          {/* Interactive Filters Bar */}
          <div className="mt-8">
            <EventFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              totalFilteredCount={filteredEvents.length}
              totalCount={initialEvents.length}
              onReset={handleResetFilters}
            />
          </div>
        </div>

        {/* 6-Card Event Grid or Empty State */}
        {filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {filteredEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onViewDetails={handleOpenDetails}
                onRegister={handleOpenRegister}
              />
            ))}
          </div>
        ) : (
          /* Friendly Empty State */
          <div className="rounded-2xl border border-[var(--theme-primary,#00f0ff)]/25 bg-[#03080a] p-12 text-center shadow-[0_0_30px_rgba(0, 240, 255,0.1)]">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--theme-primary,#00f0ff)]/40 bg-[var(--theme-primary,#00f0ff)]/10 text-[var(--theme-primary,#00f0ff)]">
              <SearchX className="h-7 w-7" />
            </div>
            <h3 className="mt-4 text-xl font-clash font-bold text-[var(--theme-bg-hero,#dce6ef)]">No Matching Events Found</h3>
            <p className="mt-2 max-w-md mx-auto text-sm text-[var(--theme-primary,#00f0ff)]/70 leading-relaxed font-cabinet">
              We couldn&apos;t find any events matching your search keyword &quot;{searchQuery}&quot; in the &quot;{selectedCategory}&quot; category.
            </p>
            <div className="mt-6">
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--theme-primary,#00f0ff)]/40 bg-[var(--theme-primary,#00f0ff)]/20 px-5 py-2.5 text-xs font-clash font-bold uppercase tracking-wider text-[var(--theme-primary,#00f0ff)] hover:bg-[var(--theme-primary,#00f0ff)] hover:text-[var(--theme-bg-main,#060913)] transition-all cursor-pointer"
              >
                <RefreshCcw className="h-3.5 w-3.5" />
                <span>Clear All Filters</span>
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 4. Past Events Section */}
      <PastEventsSection />

      {/* 5. Call To Action Section */}
      <CtaSection />

      {/* Accessible Event Details Modal */}
      <EventModal
        event={detailsEvent}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        onOpenRegister={handleOpenRegister}
      />

      {/* Accessible Event Registration Modal */}
      <RegistrationModal
        event={registerEvent}
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
      />
    </div>
  );
}
