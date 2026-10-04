import test from "node:test";
import assert from "node:assert/strict";
import {
  appendStudyCompletion,
  type CompletedChapterRecord,
} from "./study-focus.ts";
const record: CompletedChapterRecord = {
  sessionId: "session",
  chapterId: "one",
  chapterTitle: "Databases",
  stack: "Backend",
  day: 1,
  date: "2026-10-04",
  completedAt: "2026-10-04T08:00:00Z",
  durationMinutes: 0,
  distractions: 0,
  notes: "",
};
test("completion retries preserve one record for the same study session", () => {
  const records = appendStudyCompletion([], record);
  assert.equal(
    appendStudyCompletion(records, {
      ...record,
      completedAt: "2026-10-04T08:00:01Z",
    }).length,
    1,
  );
  assert.equal(records[0].durationMinutes, 0);
});
test("separate study sessions and legacy chapter records remain distinct", () => {
  const legacy = { ...record, sessionId: undefined };
  const records = appendStudyCompletion([legacy], record);
  assert.equal(
    appendStudyCompletion(records, { ...record, sessionId: "second" }).length,
    3,
  );
});
