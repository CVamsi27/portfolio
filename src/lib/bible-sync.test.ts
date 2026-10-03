import test from "node:test";
import assert from "node:assert/strict";
import { refreshBibleChapters } from "./bible-sync.ts";

test("refreshes saved chapter priorities while preserving dated work and schedule", () => {
  const saved = [{ date: "2026-10-03", schedule: { custom: "Interview" }, chapters: [{ id: "a", title: "Old", studyUrl: "old", rolePriority: "Essential" }] }];
  const latest = [{ date: "2026-10-03", chapters: [{ id: "a", title: "Animation", studyUrl: "new", rolePriority: "Optional", generalImportance: "Specialized" }] }];
  const result = refreshBibleChapters(saved, latest);
  assert.equal(result[0].chapters[0].rolePriority, "Optional");
  assert.equal(result[0].chapters[0].studyUrl, "new");
  assert.deepEqual(result[0].schedule, { custom: "Interview" });
  assert.equal(saved[0].chapters[0].title, "Old");
});

test("falls back to canonical dated chapters when a saved path is removed", () => {
  const latest = [{ date: "2026-10-03", chapters: [{ id: "current" }] }];
  assert.deepEqual(refreshBibleChapters([{ date: "2026-10-03", chapters: [{ id: "removed" }] }], latest)[0].chapters, latest[0].chapters);
});
