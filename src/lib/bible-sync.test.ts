import test from "node:test";
import assert from "node:assert/strict";
import { refreshBibleChapters } from "./bible-sync.ts";

test("refreshes saved chapter priorities while preserving dated work and schedule", () => {
  const saved = [
    {
      date: "2026-10-03",
      schedule: { custom: "Interview" },
      chapters: [
        { id: "a", title: "Old", studyUrl: "old", rolePriority: "Essential" },
      ],
    },
  ];
  const latest = [
    {
      date: "2026-10-03",
      chapters: [
        {
          id: "a",
          title: "Animation",
          studyUrl: "new",
          rolePriority: "Optional",
          generalImportance: "Specialized",
        },
      ],
    },
  ];
  const result = refreshBibleChapters(saved, latest);
  assert.equal(result[0].chapters[0].rolePriority, "Optional");
  assert.equal(result[0].chapters[0].studyUrl, "new");
  assert.deepEqual(result[0].schedule, { custom: "Interview" });
  assert.equal(saved[0].chapters[0].title, "Old");
});

test("keeps removed saved chapter IDs visible instead of moving scheduled evidence", () => {
  const latest = [{ date: "2026-10-03", chapters: [{ id: "current" }] }];
  assert.deepEqual(
    refreshBibleChapters(
      [{ date: "2026-10-03", chapters: [{ id: "removed" }] }],
      latest,
    )[0].chapters,
    [{ id: "removed", catalogueStatus: "missing" }],
  );
});

test("restored canonical chapters clear the missing marker without changing the saved date", () => {
  const saved = [
    {
      date: "2026-10-24",
      chapters: [{ id: "restored", catalogueStatus: "missing" }],
    },
  ];
  const latest = [
    {
      date: "2026-10-26",
      chapters: [{ id: "restored", title: "Current canonical title" }],
    },
  ];
  const next = refreshBibleChapters(saved, latest);
  assert.notEqual(next[0].chapters[0].catalogueStatus, "missing");
  assert.equal(next[0].date, "2026-10-24");
});
