/** Owner-only release: credentials stay in the environment; private payload is never imported by Next.js. */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { assertPrivateWorkspacePath } from "./private-workspace.ts";
import {
  decodeTrackerHistoryRows,
  prepareTrackerHistoryRows,
} from "./tracker-history-rows.ts";
import { isDeepStrictEqual } from "node:util";
import { createClient } from "@supabase/supabase-js";
import { TIMETABLE_OWNER_EMAIL } from "../src/lib/personal-timetable.ts";
import { isCareerPlan, mergeCareerPlan } from "../src/lib/career-roadmap.ts";
const payloadPath = process.argv
  .find((arg) => arg.startsWith("--payload="))
  ?.slice(10);
const apply = process.argv.includes("--apply");
async function run() {
  if (!payloadPath)
    throw new Error("Pass --payload=PATH_TO_PRIVATE_GENERATED_PLAN");
  const absolute = assertPrivateWorkspacePath(payloadPath);
  const plan = JSON.parse(readFileSync(absolute, "utf8"));
  if (!isCareerPlan(plan)) throw new Error("Invalid career plan payload");
  const url = process.env.SUPABASE_URL,
    secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret)
    throw new Error(
      "SUPABASE_URL and SUPABASE_SECRET_KEY required for owner read/dry-run",
    );
  const client = createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const owners = [];
  for (let page = 1; ; page++) {
    const { data, error } = await client.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    if (error) throw error;
    owners.push(
      ...data.users.filter(
        (u) => u.email?.toLowerCase() === TIMETABLE_OWNER_EMAIL,
      ),
    );
    if (data.users.length < 1000) break;
  }
  if (owners.length !== 1)
    throw new Error("Exact owner could not be uniquely resolved");
  const owner = owners[0].id;
  const { data: before, error } = await client
    .from("tracker_data")
    .select("key,value,updated_at")
    .eq("user_id", owner);
  if (error) throw error;
  const decodedBefore = await decodeTrackerHistoryRows(before ?? []);
  const prior = new Map(decodedBefore.map((r) => [r.key, r]));
  const career = prior.get("career_command_center");
  if (!career || typeof career.value !== "object" || career.value === null)
    throw new Error(
      "Existing owner career row required; the release never creates or resets data",
    );
  const { changes } = await prepareTrackerHistoryRows(before ?? [], [
    {
      key: career.key,
      value: mergeCareerPlan(career.value as Record<string, unknown>, plan),
      version: career.updated_at,
    },
  ]);
  console.log(
    JSON.stringify(
      {
        mode: apply ? "apply" : "dry-run",
        ownerResolved: true,
        ownerRows: before!.length,
        changedKeys: changes.map((r) => r.key),
        planSections: plan.sections.length,
        planUpdated: plan.updated,
        sourceDigest: plan.sourceDigest,
      },
      null,
      2,
    ),
  );
  if (!apply || changes.length === 0) return;
  const backup = resolve(
    dirname(absolute),
    `career-plan-before-${Date.now()}.json`,
  );
  writeFileSync(backup, JSON.stringify(before, null, 2) + "\n", {
    mode: 0o600,
    flag: "wx",
  });
  const applied = [];
  try {
    // Each update is an atomic compare-and-swap; a conflict stops the release.
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
    const { data: after, error: readError } = await client
      .from("tracker_data")
      .select("key,value,updated_at")
      .eq("user_id", owner);
    if (readError) throw readError;
    if (after!.length !== before!.length)
      throw new Error("Owner row count changed during verification");
    for (const row of before!) {
      const expected =
        changes.find((r) => r.key === row.key)?.value ?? row.value;
      const actual = after!.find((r) => r.key === row.key);
      if (!actual || !isDeepStrictEqual(actual.value, expected))
        throw new Error(
          `Readback mismatch or concurrent modification in ${row.key}`,
        );
    }
    console.log(
      `Verified ${applied.length} changed rows and ${before!.length - applied.length} untouched owner rows. Backup retained in the canonical private reports directory.`,
    );
  } catch (error) {
    throw new Error(
      `Release stopped; applied keys: ${applied.join(", ") || "none"}. Private backup retained. ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}
run().catch((error) => {
  console.error(
    error instanceof Error ? error.message : "Owner release failed",
  );
  process.exitCode = 1;
});
