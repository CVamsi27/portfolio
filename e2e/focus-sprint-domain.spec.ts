import { expect, test } from "@playwright/test";
import {
  FOCUS_PRESETS,
  completeFocusSession,
  focusMinutesForDates,
  getFocusElapsedMs,
  getFocusRemainingMs,
} from "../src/lib/focus-sprint";

test.describe("focus sprint domain", () => {
  test("exposes the strict-session presets", () => {
    expect(FOCUS_PRESETS.map((preset) => preset.minutes)).toEqual([25, 50, 90]);
  });

  test("clamps elapsed and remaining time to the planned duration", () => {
    const active = { id: "focus_1", label: "Visa checklist", plannedMinutes: 25 as const, startedAt: 1_000, pausedMs: 0 };
    expect(getFocusElapsedMs(active, 1_000 + 30 * 60_000)).toBe(25 * 60_000);
    expect(getFocusRemainingMs(active, 1_000 - 1)).toBe(25 * 60_000);
  });

  test("creates a completed record without changing task or goal data", () => {
    const session = completeFocusSession(
      { id: "focus_1", label: "Visa checklist", plannedMinutes: 25, startedAt: 1_000, pausedMs: 0 },
      1_000 + 20 * 60_000,
    );
    expect(session).toMatchObject({
      id: "focus_1",
      label: "Visa checklist",
      status: "completed",
      durationMinutes: 20,
    });
  });

  test("aggregates only completed sessions for the requested date", () => {
    expect(
      focusMinutesForDates(
        [
          {
            id: "a",
            label: "a",
            plannedMinutes: 25,
            startedAt: Date.parse("2026-09-20T09:00:00Z"),
            endedAt: Date.parse("2026-09-20T09:20:00Z"),
            durationMinutes: 20,
            status: "completed",
            createdAt: 1,
          },
          {
            id: "b",
            label: "b",
            plannedMinutes: 25,
            startedAt: Date.parse("2026-09-20T10:00:00Z"),
            endedAt: Date.parse("2026-09-20T10:10:00Z"),
            durationMinutes: 10,
            status: "cancelled",
            createdAt: 1,
          },
        ],
        "2026-09-20",
      ),
    ).toBe(20);
  });

  test("ignores malformed duration values from stale local storage", () => {
    expect(
      focusMinutesForDates(
        [
          {
            id: "stale",
            label: "stale record",
            plannedMinutes: 25,
            startedAt: Date.parse("2026-09-20T10:00:00Z"),
            durationMinutes: Number.NaN,
            status: "completed",
            createdAt: 1,
          },
        ],
        "2026-09-20",
      ),
    ).toBe(0);
  });
});
