import test from "node:test";
import assert from "node:assert/strict";
import { dueRoutineGroups, deliveryGroupKey } from "./routine-delivery.ts";
import { routineDefaults, type RoutineHistory } from "./routine-reminders.ts";
test("Lunch and Omega-3 form one group; completing Lunch does not change its delivery identity", () => {
  const schedules = routineDefaults("cvamsik99@gmail.com");
  const now = Date.parse("2026-10-05T14:00:00+05:30");
  const groups = dueRoutineGroups(schedules, {}, now);
  assert.equal(groups.size, 1);
  const [at, items] = [...groups][0];
  assert.deepEqual(
    items.map((item) => item.reminderId),
    ["lunch", "omega3"],
  );
  const history: Record<string, RoutineHistory> = {
    [items[0].id]: {
      ...items[0],
      status: "done",
      completedAt: now,
      updatedAt: now,
    },
  };
  const after = dueRoutineGroups(schedules, history, now);
  assert.equal(
    deliveryGroupKey("endpoint", [...after][0][0]),
    deliveryGroupKey("endpoint", at),
  );
  assert.equal([...after][0][1][0].reminderId, "omega3");
});
test("snoozing keeps the occurrence ID and creates a later delivery group without a new dose", () => {
  const schedules = routineDefaults("cvamsik99@gmail.com");
  const now = Date.parse("2026-10-05T08:00:00+05:30");
  const item = [...dueRoutineGroups(schedules, {}, now).values()][0][0];
  const history: Record<string, RoutineHistory> = {
    [item.id]: {
      ...item,
      status: "snoozed",
      snoozeUntil: now + 10 * 60_000,
      updatedAt: now,
    },
  };
  assert.equal(dueRoutineGroups(schedules, history, now).size, 0);
  const later = [...dueRoutineGroups(schedules, history, now + 10 * 60_000)][0];
  assert.equal(later[1][0].id, item.id);
  assert.notEqual(
    deliveryGroupKey("endpoint", later[0]),
    deliveryGroupKey("endpoint", now),
  );
});
test("missed Monday B12 does not send as a Tuesday dose", () => {
  const now = Date.parse("2026-10-06T08:00:00+05:30");
  assert.equal(
    dueRoutineGroups(routineDefaults("cvamsik99@gmail.com"), {}, now).size,
    0,
  );
});
