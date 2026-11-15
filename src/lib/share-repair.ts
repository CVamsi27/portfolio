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

export const MAX_REPAIR_ATTEMPTS = 3;
export const REPAIR_RETRY_MS = 1500;

/**
 * Upload the inline bytes of each target, retrying the whole pass with a growing
 * pause so a dropped connection does not leave the bytes inline until the next
 * visit. Upload names are keyed by drop and index, so a repeat pass overwrites
 * its own objects instead of duplicating them.
 */
export async function repairInlineImages<T extends RepairableDrop>(
  targets: ImageRepairTarget<T>[],
  upload: (dataUrl: string, name: string) => Promise<string | null>,
  sleep: (ms: number) => Promise<void>,
  attempts = MAX_REPAIR_ATTEMPTS,
): Promise<{ repairs: Map<string, string[]>; attempts: number }> {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const repairs = new Map<string, string[]>();
    for (const { drop, sources } of targets) {
      const next = [...sources];
      let changed = false;
      for (let index = 0; index < sources.length; index += 1) {
        if (!isInlineImage(sources[index])) continue;
        const path = await upload(
          sources[index],
          `repair-${drop.id}-${index}`,
        );
        if (path) {
          next[index] = path;
          changed = true;
        }
      }
      if (changed) repairs.set(drop.id, next);
    }
    if (repairs.size > 0) return { repairs, attempts: attempt };
    if (attempt < attempts) await sleep(REPAIR_RETRY_MS * attempt);
  }
  return { repairs: new Map(), attempts };
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
