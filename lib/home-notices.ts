import { prisma } from "@/lib/prisma";
import type { NoticeCategory, NoticeItem } from "@/lib/types";

export type HomepageNotice = Pick<
  NoticeItem,
  "id" | "title" | "date" | "slug" | "category" | "priority"
>;

export type HomepageNoticeData = {
  notices: HomepageNotice[];
  newThisWeek: number;
  urgentCount: number;
  unavailable: boolean;
};

function getCategory(priority: NoticeItem["priority"], category: string): NoticeCategory {
  if (priority === "URGENT") return "Urgent";

  const normalized = category.trim().toLowerCase();
  if (normalized === "project" || normalized === "projects") return "Projects";
  if (normalized === "event" || normalized === "events") return "Events";
  return "General";
}

export async function getHomepageNotices(): Promise<HomepageNoticeData> {
  try {
    const notices = await prisma.notice.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        title: true,
        date: true,
        slug: true,
        category: true,
        priority: true,
        createdAt: true,
      },
    });

    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentNotices = notices.slice(0, 5);
    const latestUrgent = notices.find((notice) => notice.priority === "URGENT");
    if (latestUrgent && !recentNotices.some((notice) => notice.id === latestUrgent.id)) {
      recentNotices.splice(4, 1, latestUrgent);
    }
    recentNotices.sort((a, b) => {
      if (a.priority === "URGENT" && b.priority !== "URGENT") return -1;
      if (b.priority === "URGENT" && a.priority !== "URGENT") return 1;
      return b.date.getTime() - a.date.getTime();
    });

    return {
      notices: recentNotices.map((notice) => ({
        id: notice.id.toString(),
        title: notice.title,
        date: notice.date.toISOString().slice(0, 10),
        slug: notice.slug,
        category: getCategory(notice.priority, notice.category),
        priority: notice.priority,
      })),
      newThisWeek: notices.filter((notice) => notice.createdAt.getTime() >= weekAgo).length,
      urgentCount: notices.filter((notice) => notice.priority === "URGENT").length,
      unavailable: false,
    };
  } catch (error) {
    console.error("Homepage notices fetch error:", error);
    return { notices: [], newThisWeek: 0, urgentCount: 0, unavailable: true };
  }
}
