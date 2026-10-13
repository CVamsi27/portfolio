import assert from "node:assert/strict";
import { test } from "node:test";
import { focusPreferences } from "./focus-preferences.ts";
test("invalid or older focus preferences fall back to supported session settings", () => {
  assert.deepEqual(
    focusPreferences({ plannedMinutes: 0, mode: "invalid", fullscreen: "yes" }),
    { plannedMinutes: 25, mode: "timed", fullscreen: false },
  );
  assert.deepEqual(focusPreferences(null), {
    plannedMinutes: 25,
    mode: "timed",
    fullscreen: false,
  });
});
test("valid saved defaults are available for a new session without changing completed history", () => {
  assert.deepEqual(
    focusPreferences({ plannedMinutes: 50, mode: "open", fullscreen: true }),
    { plannedMinutes: 50, mode: "open", fullscreen: true },
  );
});
