import {
  dropImageSources,
  imageStoragePath,
  isInlineImage,
} from "./share-domain.ts";

export type RepairableDrop = {
  id: string;
  image?: string | null;
  imagePath?: string | null;
  images?: string[] | null;
};

export type ImageRepairTarget<T extends RepairableDrop> = {
  drop: T;
  /** Every image on the drop, in display order. */
  sources: string[];
};

/**
 * Drops whose media still lives only in the synced JSON as a data URL.
 * Those bytes are too big to reach another device, so the signed-in owner
 * re-uploads them and swaps in storage paths.
 */
export function inlineImageRepairTargets<T extends RepairableDrop>(
  drops: T[],
): ImageRepairTarget<T>[] {
  const targets: ImageRepairTarget<T>[] = [];
  for (const drop of drops) {
    const sources = dropImageSources(drop);
    if (sources.some(isInlineImage)) targets.push({ drop, sources });
  }
  return targets;
}

/** Replace repaired image lists in place, keeping every other drop untouched. */
export function applyImageRepairs<T extends RepairableDrop>(
  drops: T[],
  repairs: Map<string, string[]> | Record<string, string[]>,
): T[] {
  const table =
    repairs instanceof Map ? repairs : new Map(Object.entries(repairs));
  if (table.size === 0) return drops;
  return drops.map((drop) => {
    const next = table.get(drop.id);
    if (!next || next.length === 0) return drop;
    const paths = next.filter((source) => imageStoragePath(source) !== null);
    return {
      ...drop,
      image: null,
      images: next,
      imagePath: paths[0] ?? null,
    };
  });
}
