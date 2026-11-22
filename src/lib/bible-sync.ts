export type BibleChapter = {
  id: string;
  title: string;
  studyUrl: string;
  catalogueStatus?: "current" | "missing";
  rolePriority?: "Essential" | "Important" | "Optional" | "Deferred";
  generalImportance?: "Foundational" | "Important" | "Specialized";
};

type StoredBibleDay = {
  date: string;
  chapters?: Array<{ id: string }> | null;
};

function storedChapters(day: StoredBibleDay): Array<{ id: string }> {
  return Array.isArray(day.chapters) ? day.chapters : [];
}

/**
 * Refresh catalogue facts without moving a user's scheduled chapters or work.
 * Stored timetables can predate the chapter arrays this page relies on, so a
 * missing or malformed list is treated as empty instead of breaking the page.
 */
export function refreshBibleChapters<T extends StoredBibleDay>(
  saved: T[],
  latest: StoredBibleDay[],
): T[] {
  const catalogue = new Map(
    latest.flatMap((day) =>
      storedChapters(day).map((chapter) => [chapter.id, chapter] as const),
    ),
  );
  return saved.map((day) => ({
    ...day,
    chapters: storedChapters(day).map((chapter) =>
      catalogue.has(chapter.id)
        ? {
            ...chapter,
            ...catalogue.get(chapter.id),
            catalogueStatus: "current",
          }
        : { ...chapter, catalogueStatus: "missing" },
    ),
  })) as T[];
}
