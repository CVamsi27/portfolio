import assert from "node:assert/strict";
import { test } from "node:test";
import {
  alignPersonalTimetable,
  personalSchedule,
} from "./personal-timetable.ts";

test("only the exact owner receives the Bible timetable", () => {
  for (const email of [null, "other@gmail.com", "cvamsik99@gmail.com.evil"])
    assert.equal(personalSchedule(email, "2026-10-05"), undefined);
  const schedule = personalSchedule(" CVAMSIK99@gmail.com ", "2026-10-05")!;
  assert.equal(
    Object.values(schedule).reduce((sum, block) => sum + block.minutes, 0),
    600,
  );
  assert.deepEqual(Object.keys(schedule), [
    "08:30-10:30",
    "10:30-12:30",
    "12:30-14:00",
    "14:30-16:30",
    "16:30-17:30",
    "17:30-18:00",
    "20:30-21:30",
  ]);
});
test("both weekend days, including launch Sunday, have four focused hours", () => {
  assert.equal(
    Object.values(
      personalSchedule("cvamsik99@gmail.com", "2026-10-10")!,
    ).reduce((sum, block) => sum + block.minutes, 0),
    240,
  );
  assert.equal(
    Object.values(
      personalSchedule("cvamsik99@gmail.com", "2026-10-11")!,
    ).reduce((sum, block) => sum + block.minutes, 0),
    240,
  );
  assert.equal(
    Object.values(
      personalSchedule("cvamsik99@gmail.com", "2026-10-04")!,
    ).reduce((sum, block) => sum + block.minutes, 0),
    240,
  );
  assert.equal(
    personalSchedule("cvamsik99@gmail.com", "2026-10-02"),
    undefined,
  );
});
test("alignment preserves progress, earlier dates and other accounts without mutating input", () => {
  const timetable = {
    days: [
      {
        date: "2026-10-05",
        schedule: { old: "Old" },
        checklist: [{ id: "proof", done: true }],
      },
      { date: "2026-10-02", schedule: { old: "Past" }, checklist: [] },
    ],
    extra: "preserved",
  };
  assert.equal(
    alignPersonalTimetable("someone@gmail.com", timetable),
    timetable,
  );
  const aligned = alignPersonalTimetable("cvamsik99@gmail.com", timetable);
  assert.equal(aligned.days[0].checklist, timetable.days[0].checklist);
  assert.equal(aligned.days[1], timetable.days[1]);
  assert.equal(aligned.extra, "preserved");
  assert.deepEqual(timetable.days[0].schedule, { old: "Old" });
  assert.equal(Object.keys(aligned.days[0].schedule).length, 7);
});

test("block lengths match durations and protect meal and family windows", () => {
  for (const date of ["2026-10-05", "2026-10-10", "2026-10-11"]) {
    let previousEnd = 0;
    for (const [time, block] of Object.entries(
      personalSchedule("cvamsik99@gmail.com", date)!,
    )) {
      const [start, end] = time.split("-").map((part) => {
        const [h, m] = part.split(":").map(Number);
        return h * 60 + m;
      });
      assert.equal(end - start, block.minutes);
      assert.ok(start >= previousEnd);
      previousEnd = end;
      for (const [protectedStart, protectedEnd] of [
        [840, 870],
        [1080, 1230],
      ])
        assert.ok(end <= protectedStart || start >= protectedEnd);
    }
  }
});

test("new campaign fits 50 hours with recovery Sunday and weekday rotation", () => {
  const totals = [
    "2026-10-12",
    "2026-10-13",
    "2026-10-14",
    "2026-10-15",
    "2026-10-16",
    "2026-10-17",
    "2026-10-18",
  ].map((date) =>
    Object.values(personalSchedule("cvamsik99@gmail.com", date)!).reduce(
      (sum, b) => sum + b.minutes,
      0,
    ),
  );
  assert.deepEqual(totals, [540, 540, 540, 540, 540, 300, 0]);
  assert.equal(
    totals.reduce((a, b) => a + b, 0),
    3000,
  );
  assert.match(
    personalSchedule("cvamsik99@gmail.com", "2026-10-12")!["14:30-16:00"].label,
    /Open source/,
  );
  assert.match(
    personalSchedule("cvamsik99@gmail.com", "2026-10-13")!["14:30-16:00"].label,
    /Networking/,
  );
  assert.equal(personalSchedule("other@example.com", "2026-10-12"), undefined);
});
test("impossible dates never receive a schedule and future blocks protect breaks", () => {
  for (const date of ["2026-13-12", "2026-02-30", "2026-10-32"])
    assert.equal(personalSchedule("cvamsik99@gmail.com", date), undefined);
  for (const date of ["2026-10-12", "2026-10-17"]) {
    let endOfPrevious = 0;
    for (const [range, block] of Object.entries(
      personalSchedule("cvamsik99@gmail.com", date)!,
    )) {
      const [start, end] = range.split("-").map((time) => {
        const [h, m] = time.split(":").map(Number);
        return h * 60 + m;
      });
      assert.equal(end - start, block.minutes);
      assert.ok(start >= endOfPrevious);
      endOfPrevious = end;
      for (const [a, b] of [
        [840, 870],
        [1065, 1230],
      ])
        assert.ok(end <= a || start >= b);
    }
  }
});
