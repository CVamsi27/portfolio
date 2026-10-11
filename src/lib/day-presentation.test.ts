import assert from "node:assert/strict";
import { test } from "node:test";
import {
  containingWeek,
  agendaPeriod,
  agendaStatus,
} from "./day-presentation.ts";
import type { AgendaItem } from "./day-plan.ts";

test("a selected Sunday stays at the end of its containing week", () => {
  assert.deepEqual(containingWeek("2026-10-11"), [
    "2026-10-05",
    "2026-10-06",
    "2026-10-07",
    "2026-10-08",
    "2026-10-09",
    "2026-10-10",
    "2026-10-11",
  ]);
  assert.deepEqual(containingWeek("2026-01-01"), [
    "2025-12-29",
    "2025-12-30",
    "2025-12-31",
    "2026-01-01",
    "2026-01-02",
    "2026-01-03",
    "2026-01-04",
  ]);
  assert.throws(() => containingWeek("2026-02-30"), /valid date/);
});

test("agenda groups use the calendar zone and noon/evening boundaries", () => {
  for (const [at, expected] of [
    ["2026-10-11T06:29:00Z", "Morning"],
    ["2026-10-11T06:30:00Z", "Afternoon"],
    ["2026-10-11T11:30:00Z", "Evening"],
  ] as const)
    assert.equal(agendaPeriod(Date.parse(at), "Asia/Kolkata"), expected);
  assert.equal(
    agendaPeriod(Date.parse("2026-10-11T06:30:00Z"), "America/New_York"),
    "Morning",
  );
});

const row: AgendaItem = {
  id: "study",
  title: "Study",
  kind: "study",
  at: Date.parse("2026-10-11T09:00:00+05:30"),
  durationMinutes: 60,
  href: "/plan",
  done: false,
};
test("an ongoing commitment is not labeled Earlier", () => {
  assert.equal(
    agendaStatus(row, "2026-10-11", "2026-10-11", row.at + 30 * 60000),
    "Planned",
  );
  assert.equal(
    agendaStatus(row, "2026-10-11", "2026-10-11", row.at + 60 * 60000),
    "Earlier",
  );
  assert.equal(
    agendaStatus(row, "2026-10-10", "2026-10-11", row.at + 60 * 60000),
    "Planned",
  );
});
test("completed and unavailable records retain their actual status", () => {
  assert.equal(
    agendaStatus(
      { ...row, unavailable: true },
      "2026-10-11",
      "2026-10-11",
      row.at + 90 * 60000,
    ),
    "Linked task unavailable",
  );
  assert.equal(
    agendaStatus(
      { ...row, done: true, status: "skipped" },
      "2026-10-11",
      "2026-10-11",
      row.at,
    ),
    "skipped",
  );
});
