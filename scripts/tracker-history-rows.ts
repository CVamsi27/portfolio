/** CLI boundary helpers keep raw recovery records separate from decoded merges. */
import { isDeepStrictEqual } from "node:util";
import {
  decodeTrackerHistory,
  encodeTrackerHistory,
} from "../src/lib/tracker-history.ts";

type ValueRow = { key: string; value: unknown };

/** Never modify raw rows: their bytes and versions belong to recovery/readback. */
export async function decodeTrackerHistoryRows<T extends ValueRow>(
  rows: readonly T[],
): Promise<T[]> {
  return Promise.all(
    rows.map(async (row) => ({
      ...row,
      value: await decodeTrackerHistory(row.key, row.value),
    })),
  );
}

/** Preserve original wire bytes on semantic repeats, even across gzip runtimes. */
export async function prepareTrackerHistoryRows<T extends ValueRow>(
  before: readonly ValueRow[],
  proposed: readonly T[],
): Promise<{ rows: T[]; changes: T[] }> {
  const raw = new Map(before.map((row) => [row.key, row]));
  const rows: T[] = [],
    changes: T[] = [];
  for (const next of proposed) {
    const prior = raw.get(next.key);
    const decoded = await decodeTrackerHistory(next.key, next.value);
    if (
      prior &&
      isDeepStrictEqual(
        await decodeTrackerHistory(prior.key, prior.value),
        decoded,
      )
    ) {
      rows.push({ ...next, value: prior.value });
      continue;
    }
    const encoded = {
      ...next,
      value: await encodeTrackerHistory(next.key, decoded),
    };
    rows.push(encoded);
    changes.push(encoded);
  }
  return { rows, changes };
}
