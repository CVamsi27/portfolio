/** Owner-only release: credentials stay in the environment; private payload is never imported by Next.js. */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { isDeepStrictEqual } from "node:util";
import { createClient } from "@supabase/supabase-js";
import { TIMETABLE_OWNER_EMAIL } from "../src/lib/personal-timetable.ts";
import {
  alignCampaignTimetable,
  isGermanyRoadmap,
  mergeGermanyCareer,
} from "../src/lib/germany-roadmap.ts";
const payloadPath = process.argv
  .find((arg) => arg.startsWith("--payload="))
  ?.slice(10);
const apply = process.argv.includes("--apply");
async function run() {
  if (!payloadPath)
    throw new Error("Pass --payload=PATH_TO_PRIVATE_GENERATED_PLAN");
  const absolute = resolve(payloadPath);
  if (!absolute.includes("/80-lanes-abroad-full-stack/personal/"))
    throw new Error(
      "Payload and backups must remain under the canonical private personal directory",
    );
  const plan = JSON.parse(readFileSync(absolute, "utf8"));
  if (!isGermanyRoadmap(plan)) throw new Error("Invalid reviewed plan");
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
  // Read every owner row so release can prove tasks, reminders and evidence are untouched.
  const { data: before, error } = await client
    .from("tracker_data")
    .select("key,value,updated_at")
    .eq("user_id", owner);
  if (error) throw error;
  const prior = new Map((before ?? []).map((r) => [r.key, r]));
  const career = prior.get("career_command_center"),
    timetable = prior.get("timetable_100_days");
  if (!career || !timetable || !Array.isArray(timetable.value?.days))
    throw new Error(
      "Existing owner career and timetable rows required; no reset or new account is created",
    );
  const changes = [
    {
      key: career.key,
      value: mergeGermanyCareer(career.value, plan),
      version: career.updated_at,
    },
    {
      key: timetable.key,
      value: alignCampaignTimetable(TIMETABLE_OWNER_EMAIL, timetable.value),
      version: timetable.updated_at,
    },
  ].filter((r) => !isDeepStrictEqual(r.value, prior.get(r.key)!.value));
  console.log(
    JSON.stringify(
      {
        mode: apply ? "apply" : "dry-run",
        ownerResolved: true,
        ownerRows: before!.length,
        changedKeys: changes.map((r) => r.key),
        weeks: plan.weeks.length,
        sourceDigest: plan.sourceDigest,
        preservedEvidenceEntries: Object.keys(
          prior.get("career_execution_state")?.value?.evidenceByItemId ?? {},
        ).length,
        preservedStudyDays: timetable.value.days.length,
      },
      null,
      2,
    ),
  );
  if (!apply) return;
  const backup = resolve(
    dirname(absolute),
    `2026-10-10-germany-roadmap-before-${Date.now()}.json`,
  );
  writeFileSync(backup, JSON.stringify(before, null, 2) + "\n", {
    mode: 0o600,
  });
  const applied = [];
  try {
    // Each update is an atomic compare-and-swap. The two-key release is not a transaction.
    // A conflict stops the release; retain the backup and report any already applied keys.
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
