type AchievementDateFields = {
  achievementDate?: Date | string | null;
  dateDisplay?: string | null;
};

export function getAchievementDateLabel(achievement: AchievementDateFields): string | undefined {
  const dateDisplay = achievement.dateDisplay?.trim();
  if (dateDisplay && !/^date not listed$/i.test(dateDisplay)) return dateDisplay;
  if (!achievement.achievementDate) return undefined;

  const date = new Date(achievement.achievementDate);
  if (!Number.isFinite(date.getTime())) return undefined;

  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function getAchievementTimestamp(achievement: AchievementDateFields): number | null {
  if (achievement.achievementDate) {
    const timestamp = new Date(achievement.achievementDate).getTime();
    if (Number.isFinite(timestamp)) return timestamp;
  }

  const dateDisplay = achievement.dateDisplay?.trim();
  if (!dateDisplay) return null;

  const parsedDate = Date.parse(dateDisplay);
  if (Number.isFinite(parsedDate)) return parsedDate;

  const year = dateDisplay.match(/\b(?:19|20)\d{2}\b/)?.[0];
  return year ? new Date(`${year}-01-01T00:00:00.000Z`).getTime() : null;
}

export function sortAchievementsByDate<T extends AchievementDateFields>(achievements: T[]): T[] {
  return [...achievements].sort((first, second) => {
    const firstTimestamp = getAchievementTimestamp(first);
    const secondTimestamp = getAchievementTimestamp(second);

    if (firstTimestamp === null) return secondTimestamp === null ? 0 : 1;
    if (secondTimestamp === null) return -1;
    return secondTimestamp - firstTimestamp;
  });
}
