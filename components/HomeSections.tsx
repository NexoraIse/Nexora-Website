import HomeSectionPreviews from "@/components/HomeSectionPreviews";
import { getHomepageEvents } from "@/lib/home-events";
import { getHomepageAchievements } from "@/lib/home-achievements";
import { getHomepageLearningData } from "@/lib/home-learning";
import { getHomepageNotices } from "@/lib/home-notices";
import { HOME_CODE_THEME, HOME_PRACTICE_CODE } from "@/lib/mock-home-practice";
import { codeToTokens } from "shiki";
import { io } from "next/cache";

export default async function HomeSections() {
  await io();
  const [{ events, renderedAt }, notices, learning, achievements, highlightedCode] = await Promise.all([
    getHomepageEvents(),
    getHomepageNotices(),
    getHomepageLearningData(),
    getHomepageAchievements(),
    codeToTokens(HOME_PRACTICE_CODE, { lang: "python", theme: HOME_CODE_THEME }),
  ]);

  return (
    <HomeSectionPreviews
      events={events}
      initialNow={renderedAt}
      notices={notices.notices}
      noticesNewThisWeek={notices.newThisWeek}
      noticesUrgentCount={notices.urgentCount}
      noticesUnavailable={notices.unavailable}
      learning={learning}
      achievements={achievements.achievements}
      achievementsUnavailable={achievements.unavailable}
      codeTokens={highlightedCode.tokens.map((line) =>
        line.map(({ content, color, offset }) => ({ content, color, offset })),
      )}
    />
  );
}
