import { EventItem, EventCategory } from './types';
import { INITIAL_EVENTS } from './data/initial-events';

export const SAMPLE_EVENTS = INITIAL_EVENTS;

export const CATEGORIES: (EventCategory | 'All Events')[] = [
  'All Events',
  'Hackathon',
  'Technical Fest',
  'Artificial Intelligence',
  'Workshop',
  'Cybersecurity',
  'Project Exhibition',
];

/**
 * Return all configured events.
 */
export function getAllEvents(): EventItem[] {
  return [...INITIAL_EVENTS];
}

/**
 * Find an event by its ID or slug.
 */
export function getEventByIdOrSlug(identifier: string): EventItem | undefined {
  const normalized = identifier.toLowerCase().trim();
  return INITIAL_EVENTS.find(
    (e) => e.id.toLowerCase() === normalized || e.slug.toLowerCase() === normalized
  );
}

/**
 * Filter events by category and search keyword.
 */
export function filterEvents(
  events: EventItem[],
  category?: string | null,
  search?: string | null
): EventItem[] {
  let filtered = [...events];

  if (category && category !== 'All Events') {
    const targetCat = category.toLowerCase().trim();
    filtered = filtered.filter((event) => {
      const eventCat = event.category.toLowerCase();
      return eventCat === targetCat || eventCat.includes(targetCat) || targetCat.includes(eventCat);
    });
  }

  if (search && search.trim().length > 0) {
    const query = search.toLowerCase().trim();
    filtered = filtered.filter((event) => {
      return (
        event.title.toLowerCase().includes(query) ||
        event.description.toLowerCase().includes(query) ||
        event.fullDescription.toLowerCase().includes(query) ||
        event.category.toLowerCase().includes(query) ||
        event.tags.some((t) => t.toLowerCase().includes(query))
      );
    });
  }

  return filtered;
}
