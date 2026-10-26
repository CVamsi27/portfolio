export type BibleChapter = {
  id: string;
  title: string;
  studyUrl: string;
  catalogueStatus?: "current" | "missing";
  rolePriority?: "Essential" | "Important" | "Optional" | "Deferred";
  generalImportance?: "Foundational" | "Important" | "Specialized";
};

/** Refresh catalogue facts without moving a user's scheduled chapters or work. */
export function refreshBibleChapters<
  T extends { date: string; chapters: Array<{ id: string }> },
>(
  saved: T[],
  latest: Array<{ date: string; chapters: Array<{ id: string }> }>,
): T[] {
  const catalogue = new Map(
    latest.flatMap((day) =>
      day.chapters.map((chapter) => [chapter.id, chapter] as const),
    ),
  );
  return saved.map((day) => ({
    ...day,
    chapters: day.chapters.map((chapter) =>
      catalogue.has(chapter.id)
        ? {
            ...chapter,
            ...catalogue.get(chapter.id),
            catalogueStatus: "current",
          }
        : { ...chapter, catalogueStatus: "missing" },
    ),
  }));
}
