import { prisma } from "@/lib/prisma";
import { INITIAL_ACHIEVEMENTS } from "@/lib/data/initial-achievements";

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
      orderBy: [
        { achievementDate: { sort: "desc", nulls: "last" } },
        { createdAt: "desc" },
      ],
      take: 5,
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

    if (achievements.length === 0) {
      return {
        achievements: INITIAL_ACHIEVEMENTS.slice(0, 5).map((achievement) => ({
          id: achievement.id,
          title: achievement.title,
          category: achievement.category,
          competitionOrEvent: achievement.competitionOrEvent ?? null,
          awardOrPosition: achievement.awardOrPosition ?? null,
          achievementDate: achievement.achievementDate ?? null,
          dateDisplay: achievement.dateDisplay ?? null,
          image: achievement.image ?? null,
        })),
        unavailable: false,
      };
    }

    return {
      achievements: achievements.map((achievement) => ({
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
