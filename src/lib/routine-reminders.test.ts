import test from "node:test";
import assert from "node:assert/strict";
import { routineDefaults, routineOccurrences } from "./routine-reminders.ts";
test("routine defaults belong only to the requested owner", () => {
  assert.equal(routineDefaults("someone@example.com").length, 0);
  assert.equal(routineDefaults("cvamsik99@gmail.com").length, 7);
});
test("Monday B12 and the six daily items recur by IST calendar", () => {
  const schedules = routineDefaults("cvamsik99@gmail.com");
  const mon = routineOccurrences(schedules, "2026-10-05");
  assert.equal(mon.length, 7);
  assert.equal(
    mon.find((item) => item.reminderId === "b12")!.scheduledAt,
    Date.parse("2026-10-05T08:00:00+05:30"),
  );
  assert.equal(routineOccurrences(schedules, "2026-10-06").length, 6);
  assert.equal(
    mon.find((item) => item.reminderId === "magnesium")!.scheduledAt,
    Date.parse("2026-10-05T22:00:00+05:30"),
  );
});
test("omega 3 follows lunch time and each item retains its own occurrence ID", () => {
  const schedules = routineDefaults("cvamsik99@gmail.com").map((item) =>
    item.id === "lunch" ? { ...item, time: "15:00" } : item,
  );
  const items = routineOccurrences(schedules, "2026-10-05");
  assert.equal(
    items.find((item) => item.reminderId === "omega3")!.scheduledAt,
    items.find((item) => item.reminderId === "lunch")!.scheduledAt,
  );
  assert.notEqual(
    items.find((item) => item.reminderId === "omega3")!.id,
    items.find((item) => item.reminderId === "lunch")!.id,
  );
});
