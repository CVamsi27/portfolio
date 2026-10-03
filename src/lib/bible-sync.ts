export type BibleChapter = {
  id: string;
  title: string;
  studyUrl: string;
  rolePriority?: "Essential" | "Important" | "Optional" | "Deferred";
  generalImportance?: "Foundational" | "Important" | "Specialized";
};

/** Refresh catalogue facts without moving a user's scheduled chapters or work. */
export function refreshBibleChapters<T extends { date: string; chapters: Array<{ id: string }> }>(
  saved: T[],
  latest: Array<{ date: string; chapters: Array<{ id: string }> }>,
): T[] {
  const catalogue = new Map(latest.flatMap(day => day.chapters.map(chapter => [chapter.id, chapter] as const)));
  const dates = new Map(latest.map(day => [day.date, day.chapters]));
  return saved.map(day => ({
    ...day,
    chapters: day.chapters.every(chapter => catalogue.has(chapter.id)) && day.chapters.length
      ? day.chapters.map(chapter => ({ ...chapter, ...catalogue.get(chapter.id) }))
      : dates.get(day.date) ?? day.chapters,
  }));
}
