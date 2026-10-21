import type { Metadata } from "next";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import AchievementGallery from "@/components/AchievementGallery";
import ContourBackdrop from "@/components/ContourBackdrop";
import { prisma } from "@/lib/prisma";
import { INITIAL_ACHIEVEMENTS } from "@/lib/data/initial-achievements";
import "./achievements.css";

export const metadata: Metadata = {
  title: "Achievements & Awards | Nexora ISE Club",
  description: "Celebrating innovation, excellence, and milestones at Nexora ISE Club.",
};

async function getAchievements() {
  try {
    const list = await prisma.achievement.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [
        { achievementDate: { sort: "desc", nulls: "last" } },
        { createdAt: "desc" },
      ],
    });
    if (list.length > 0) {
      return list.map((a) => ({
        id: a.id,
        category: a.category,
        title: a.title,
        description: a.description,
        event: a.competitionOrEvent || a.studentOrTeamName || "Nexora Department",
        date:
          a.dateDisplay ||
          (a.achievementDate
            ? new Date(a.achievementDate).toLocaleDateString("en-US", {
                month: "short",
                year: "numeric",
              })
            : "Date not listed"),
        image: a.image || undefined,
        isSample: false,
      }));
    }
    return INITIAL_ACHIEVEMENTS.map((a) => ({
      id: a.id,
      category: a.category,
      title: a.title,
      description: a.description,
      event: a.competitionOrEvent || a.studentOrTeamName || "Nexora Department",
      date: a.dateDisplay || "Date not listed",
      image: a.image || undefined,
      isSample: false,
    }));
  } catch (error) {
    console.error("Failed to load achievements on server:", error);
    return INITIAL_ACHIEVEMENTS.map((a) => ({
      id: a.id,
      category: a.category,
      title: a.title,
      description: a.description,
      event: a.competitionOrEvent || a.studentOrTeamName || "Nexora Department",
      date: a.dateDisplay || "Date not listed",
      image: a.image || undefined,
      isSample: false,
    }));
  }
}

export default async function AchievementsPage() {
  const initialAchievements = await getAchievements();

  return (
    <main className="relative min-h-screen w-full isolate bg-[var(--theme-bg-main,#060913)] text-[var(--theme-bg-hero,#dce6ef)]">
      <ContourBackdrop />

      <Navbar />

      <div className="relative z-10 pb-16">
        <AchievementGallery initialAchievements={initialAchievements} />
      </div>

      <Footer />
    </main>
  );
}
