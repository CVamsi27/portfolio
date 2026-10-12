import assert from "node:assert/strict";
import { test } from "node:test";
import { editablePlanBlocks } from "./plan-presentation.ts";

const block = (id: string, date = "2026-10-12", extra = {}) => ({
  id,
  date,
  title: id,
  startLocal: "09:00",
  durationMinutes: 30,
  timeZone: "Asia/Kolkata",
  kind: "event" as const,
  updatedAt: 1,
  ...extra,
});
test("Plan exposes editable activities while retaining completed activities and excluding fixed/deleted blocks", () => {
  const blocks = Object.fromEntries(
    [
      block("personal", undefined, { completedAt: 2 }),
      block("owner:fixed"),
      block("timetable:fixed"),
      block("deleted", undefined, { deleted: true }),
    ].map((b) => [b.id, b]),
  );
  assert.deepEqual(
    editablePlanBlocks(blocks, "2026-10-12").map((b) => b.id),
    ["personal"],
  );
});
test("week editor includes its last day but excludes dates outside the chosen week", () => {
  const blocks = Object.fromEntries(
    [
      block("before", "2026-10-11"),
      block("first"),
      block("last", "2026-10-18"),
      block("after", "2026-10-19"),
    ].map((b) => [b.id, b]),
  );
  assert.deepEqual(
    editablePlanBlocks(blocks, "2026-10-12", 7).map((b) => b.id),
    ["first", "last"],
  );
});
