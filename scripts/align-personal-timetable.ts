import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "node:fs";
import { alignPersonalTimetable, TIMETABLE_OWNER_EMAIL } from "../src/lib/personal-timetable.ts";

const canonical = (value: unknown): string => JSON.stringify(value, (_key, item) => item && typeof item === "object" && !Array.isArray(item) ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => a.localeCompare(b))) : item);

const apply = process.argv.includes("--apply");
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) throw new Error("SUPABASE_URL and SUPABASE_SECRET_KEY are required.");
const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(15000) }) } });
const matches = [];
for (let page = 1; ; page++) {
  const { data, error } = await client.auth.admin.listUsers({ page, perPage: 100 });
  if (error) throw new Error(`Unable to resolve timetable owner (status ${error.status ?? "unavailable"}, code ${error.code ?? error.name}).`);
  matches.push(...data.users.filter(user => user.email?.trim().toLowerCase() === TIMETABLE_OWNER_EMAIL));
  if (data.users.length < 100) break;
}
if (matches.length !== 1) throw new Error(`Expected exactly one owner account; found ${matches.length}.`);
const user = matches[0];
const { data: row, error } = await client.from("tracker_data").select("value,updated_at").eq("user_id", user.id).eq("key", "timetable_100_days").single();
if (error || !Array.isArray(row?.value?.days)) throw new Error("Owner timetable is missing or invalid; no data changed.");
const aligned = { ...alignPersonalTimetable(user.email, row.value), timezone: "Asia/Kolkata", scheduleSource: "software-developer-bible/80-lanes-abroad-full-stack/personal/reports/100-day-job-roadmap.md", scheduleReviewedOn: "2026-10-03", scheduleBudget: { weekdayFocusedMinutes: 600, weekendDayFocusedMinutes: 240, requestedByOwnerOn: "2026-10-03" } };
const changedDays = aligned.days.filter((day: unknown, index: number) => canonical(day) !== canonical(row.value.days[index])).length;
console.log(JSON.stringify({ mode: apply ? "apply" : "dry-run", owner: TIMETABLE_OWNER_EMAIL, changedDays, totalDays: aligned.days.length, rowsToUpdate: 1, progressPreserved: true }));
if (apply) {
  const backupPath = `/tmp/portfolio-timetable-before-${Date.now()}.json`;
  writeFileSync(backupPath, JSON.stringify(row.value, null, 2), { mode: 0o600 });
  const { data, error: updateError } = await client.from("tracker_data").update({ value: aligned, updated_at: new Date().toISOString() }).eq("user_id", user.id).eq("key", "timetable_100_days").eq("updated_at", row.updated_at).select("value").single();
  if (updateError || JSON.stringify(data?.value) !== JSON.stringify(aligned)) {
    // JSONB key ordering can differ; compare canonically for readback.
    if (updateError || canonical(data?.value) !== canonical(aligned)) throw new Error(`Update/readback failed; preserved backup at ${backupPath}.`);
  }
  console.log(`Owner timetable updated and verified. Backup: ${backupPath}`);
}
