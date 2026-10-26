import { writeFileSync } from "node:fs";
import { isDeepStrictEqual } from "node:util";
import type { SupabaseClient } from "@supabase/supabase-js";

type OwnerRow = { key: string; value: unknown; updated_at: string };
type Change = { key: string; value: unknown; version: string };

/** The caller resolves the owner, validates paths and prepares the reviewed changes. */
export async function applyOwnerRelease({
  client,
  owner,
  before,
  changes,
  backupPath,
}: {
  client: Pick<SupabaseClient, "from">;
  owner: string;
  before: OwnerRow[];
  changes: Change[];
  backupPath: string;
}): Promise<{ appliedKeys: string[]; untouchedRows: number }> {
  if (changes.length === 0)
    return { appliedKeys: [], untouchedRows: before.length };
  writeFileSync(backupPath, JSON.stringify(before, null, 2) + "\n", {
    mode: 0o600,
    flag: "wx",
  });
  const applied: string[] = [];
  try {
    // Each update is an atomic compare-and-swap; this release is not a transaction.
    for (const row of changes) {
      const { data, error } = await client
        .from("tracker_data")
        .update({ value: row.value, updated_at: new Date().toISOString() })
        .eq("user_id", owner)
        .eq("key", row.key)
        .eq("updated_at", row.version)
        .select("key")
        .maybeSingle();
      if (error) throw error;
      if (!data)
        throw new Error(
          `Concurrent change in ${row.key}; owner data was not overwritten`,
        );
      applied.push(row.key);
    }
    const { data: after, error } = await client
      .from("tracker_data")
      .select("key,value,updated_at")
      .eq("user_id", owner);
    if (error) throw error;
    if (!after || after.length !== before.length)
      throw new Error("Owner row count changed during verification");
    for (const row of before) {
      const expected =
        changes.find((change) => change.key === row.key)?.value ?? row.value;
      const actual = after.find((candidate) => candidate.key === row.key);
      if (!actual || !isDeepStrictEqual(actual.value, expected))
        throw new Error(
          `Readback mismatch or concurrent modification in ${row.key}`,
        );
    }
    return {
      appliedKeys: applied,
      untouchedRows: before.length - applied.length,
    };
  } catch (error) {
    throw new Error(
      `Release stopped; applied keys: ${applied.join(", ") || "none"}. Private backup retained. ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}
