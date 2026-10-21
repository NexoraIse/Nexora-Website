import { prisma } from "@/lib/prisma";
import { sortAchievementsByDate } from "@/lib/achievement-sorting";

export type HomepageAchievement = {
  id: string;
  title: string;
  category: string;
  competitionOrEvent: string | null;
  awardOrPosition: string | null;
  achievementDate: string | null;
  dateDisplay: string | null;
  image: string | null;
};

export type HomepageAchievementData = {
  achievements: HomepageAchievement[];
  unavailable: boolean;
};

export async function getHomepageAchievements(): Promise<HomepageAchievementData> {
  try {
    const achievements = await prisma.achievement.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        category: true,
        competitionOrEvent: true,
        awardOrPosition: true,
        achievementDate: true,
        dateDisplay: true,
        image: true,
      },
    });

    const sortedAchievements = sortAchievementsByDate(achievements);

    return {
      achievements: sortedAchievements.slice(0, 5).map((achievement) => ({
        ...achievement,
        achievementDate: achievement.achievementDate?.toISOString() ?? null,
      })),
      unavailable: false,
    };
  } catch (error) {
    console.error("Homepage achievements fetch error:", error);
    return { achievements: [], unavailable: true };
  }
}
