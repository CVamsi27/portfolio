import { expect, test } from "@playwright/test";
import {
  DEFAULT_LOCKDOWN_PREFERENCES,
  isBedtimeLocked,
  nextBedtimeWindow,
  type LockdownPreferences,
} from "../src/lib/lockdown";

const preferences = (overrides: Partial<LockdownPreferences> = {}): LockdownPreferences => ({
  ...DEFAULT_LOCKDOWN_PREFERENCES,
  bedtimeEnabled: true,
  ...overrides,
});

test.describe("bedtime lockdown domain", () => {
  test("does not lock while disabled", () => {
    expect(isBedtimeLocked({ ...preferences(), bedtimeEnabled: false }, new Date(2026, 8, 23, 23, 0))).toBe(false);
  });

  test("handles a same-day bedtime window", () => {
    const config = preferences({ bedtimeStart: "22:00", bedtimeEnd: "23:30" });
    expect(isBedtimeLocked(config, new Date(2026, 8, 23, 22, 30))).toBe(true);
    expect(isBedtimeLocked(config, new Date(2026, 8, 23, 23, 30))).toBe(false);
  });

  test("handles an overnight window on the selected day and after midnight", () => {
    const config = preferences({ bedtimeStart: "22:30", bedtimeEnd: "07:00" });
    expect(isBedtimeLocked(config, new Date(2026, 8, 23, 23, 0))).toBe(true);
    expect(isBedtimeLocked(config, new Date(2026, 8, 24, 6, 30))).toBe(true);
    expect(isBedtimeLocked(config, new Date(2026, 8, 24, 7, 0))).toBe(false);
  });

  test("does not lock on an unselected weekday", () => {
    const config = preferences({ bedtimeDays: [1] });
    expect(isBedtimeLocked(config, new Date(2026, 8, 23, 23, 0))).toBe(false);
  });

  test("returns the active overnight window boundaries", () => {
    const window = nextBedtimeWindow(preferences(), new Date(2026, 8, 23, 23, 0));
    expect(window?.start).toEqual(new Date(2026, 8, 23, 22, 30));
    expect(window?.end).toEqual(new Date(2026, 8, 24, 7, 0));
  });
});
