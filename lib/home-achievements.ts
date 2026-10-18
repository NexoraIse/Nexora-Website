import { prisma } from "@/lib/prisma";

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
