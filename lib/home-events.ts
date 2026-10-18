import { prisma } from "@/lib/prisma";
import { getAllEvents } from "@/lib/events-data";
import type { EventItem } from "@/lib/types";

export type HomepageEventData = {
  events: EventItem[];
  renderedAt: number;
};

export async function getHomepageEvents(): Promise<HomepageEventData> {
  try {
    const events = await prisma.event.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ startDate: "asc" }, { createdAt: "desc" }],
    });

    if (events.length === 0) {
      return { events: getAllEvents(), renderedAt: Date.now() };
    }

    return {
      events: events.map((event) => ({
        id: event.id,
        title: event.title,
        slug: event.slug,
        category: event.category as EventItem["category"],
        description: event.description,
        fullDescription: event.fullDescription || event.description,
        imageUrl: event.imageUrl || "",
        iconName: (event.iconName || "Code") as EventItem["iconName"],
        eventDate: event.startDate?.toISOString() ?? null,
        endDate: event.endDate?.toISOString() ?? null,
        registrationDeadline: event.registrationDeadline?.toISOString() ?? null,
        dateDisplay: event.dateDisplay || "To be announced (TBA)",
        startTime: event.startDate?.toLocaleTimeString() ?? null,
        endTime: event.endDate?.toLocaleTimeString() ?? null,
        venue: event.venue,
        venueDisplay: event.venueDisplay || event.venue || "Campus Tech Hub (TBA)",
        status: "upcoming",
        registrationOpen: event.registrationOpen,
        registrationUrl: event.registrationUrl,
        eligibility: event.eligibility || "Open to all students",
        organizer: event.organizer || "Nexora ISE Club",
        tags: event.tags,
        isSample: false,
        createdAt: event.createdAt.toISOString(),
        updatedAt: event.updatedAt.toISOString(),
      })),
      renderedAt: Date.now(),
    };
  } catch (error) {
    console.error("Homepage events fetch error:", error);
    return { events: getAllEvents(), renderedAt: Date.now() };
  }
}
