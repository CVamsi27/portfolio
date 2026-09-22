import type { GoalCategory } from "./user-prefs";

export type ArchiveKind = "note" | "link" | "image" | "quote";

export type ArchiveItem = {
  id: string;
  body: string;
  kind: ArchiveKind;
  tags: string[];
  sourceUrl?: string;
  goalCategory?: GoalCategory | null;
  pinned: boolean;
  createdAt: number;
};

export function normalizeTags(value: string): string[] {
  return [...new Set(value.split(",").map((tag) => tag.trim().toLowerCase()).filter(Boolean))].slice(0, 8);
}

export function searchArchive(items: ArchiveItem[], query: string): ArchiveItem[] {
  const raw = query.trim().toLowerCase();
  // Parse optional `tag:<word>` prefix operator
  const tagMatch = raw.match(/^tag:(\S+)/);
  const tagFilter = tagMatch?.[1] ?? null;
  const term = tagFilter ? raw.slice(tagMatch![0].length).trim() : raw;

  return [...items]
    .filter((item) => {
      if (tagFilter && !item.tags.some((t) => t.toLowerCase() === tagFilter)) return false;
      return !term || [item.body, item.sourceUrl, item.tags.join(" "), item.kind, item.goalCategory].filter(Boolean).join(" ").toLowerCase().includes(term);
    })
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.createdAt - a.createdAt);
}
