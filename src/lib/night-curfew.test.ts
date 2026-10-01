import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_NIGHT_CURFEW_CONFIG,
  isWithinCurfewWindow,
  isNightCurfewActive,
  getNightCurfewRemainingMs,
  formatCurfewTime,
  formatCurfewCountdown,
  grantEmergencyUnlock,
  revokeEmergencyUnlock,
} from "./night-curfew.ts";

test("night curfew window detection", async (t) => {
  await t.test("correctly identifies active overnight window (22:00 to 06:00)", () => {
    // 22:00 (10:00 PM) -> active
    const at10pm = new Date("2026-10-01T22:00:00");
    assert.equal(isWithinCurfewWindow(22, 0, 6, 0, at10pm), true);

    // 23:45 (11:45 PM) -> active
    const at1145pm = new Date("2026-10-01T23:45:00");
    assert.equal(isWithinCurfewWindow(22, 0, 6, 0, at1145pm), true);

    // 00:00 (Midnight) -> active
    const atMidnight = new Date("2026-10-02T00:00:00");
    assert.equal(isWithinCurfewWindow(22, 0, 6, 0, atMidnight), true);

    // 03:30 AM -> active
    const at330am = new Date("2026-10-02T03:30:00");
    assert.equal(isWithinCurfewWindow(22, 0, 6, 0, at330am), true);

    // 05:59 AM -> active
    const at559am = new Date("2026-10-02T05:59:00");
    assert.equal(isWithinCurfewWindow(22, 0, 6, 0, at559am), true);

    // 06:00 AM -> inactive (curfew ended)
    const at600am = new Date("2026-10-02T06:00:00");
    assert.equal(isWithinCurfewWindow(22, 0, 6, 0, at600am), false);

    // 09:15 AM -> inactive
    const at915am = new Date("2026-10-02T09:15:00");
    assert.equal(isWithinCurfewWindow(22, 0, 6, 0, at915am), false);

    // 21:59 (09:59 PM) -> inactive (1 minute before curfew)
    const at959pm = new Date("2026-10-02T21:59:00");
    assert.equal(isWithinCurfewWindow(22, 0, 6, 0, at959pm), false);
  });

  await t.test("respects device targeting (mobile phone vs desktop)", () => {
    const config = { ...DEFAULT_NIGHT_CURFEW_CONFIG, onlyMobilePhones: true };
    const at11pmMs = new Date("2026-10-01T23:00:00").getTime();

    // On phone -> active
    assert.equal(isNightCurfewActive(config, at11pmMs, true), true);

    // On desktop -> inactive when onlyMobilePhones is true
    assert.equal(isNightCurfewActive(config, at11pmMs, false), false);

    // On desktop when onlyMobilePhones is disabled -> active
    const allDevicesConfig = { ...config, onlyMobilePhones: false };
    assert.equal(isNightCurfewActive(allDevicesConfig, at11pmMs, false), true);
  });

  await t.test("handles emergency unlock bypass and revocation", () => {
    const config = { ...DEFAULT_NIGHT_CURFEW_CONFIG };
    const at11pmMs = new Date("2026-10-01T23:00:00").getTime();

    // Normally active at 11 PM
    assert.equal(isNightCurfewActive(config, at11pmMs, true), true);

    // Grant 15 min emergency unlock
    const unlockedConfig = grantEmergencyUnlock(config, 15 * 60 * 1000, at11pmMs);
    assert.equal(unlockedConfig.emergencyUnlockedUntil, at11pmMs + 15 * 60 * 1000);

    // While within unlock period -> inactive
    assert.equal(isNightCurfewActive(unlockedConfig, at11pmMs + 5 * 60 * 1000, true), false);

    // After unlock period expires -> active again
    assert.equal(isNightCurfewActive(unlockedConfig, at11pmMs + 16 * 60 * 1000, true), true);

    // Manual revocation -> immediately active again
    const revokedConfig = revokeEmergencyUnlock(unlockedConfig);
    assert.equal(revokedConfig.emergencyUnlockedUntil, null);
    assert.equal(isNightCurfewActive(revokedConfig, at11pmMs + 2 * 60 * 1000, true), true);
  });

  await t.test("calculates remaining curfew time and formats countdown", () => {
    const config = { ...DEFAULT_NIGHT_CURFEW_CONFIG, startHour: 22, startMinute: 0, endHour: 6, endMinute: 0 };
    // At 22:00 (10:00 PM), target is 06:00 AM next day (exactly 8 hours = 28,800,000 ms)
    const at10pmMs = new Date("2026-10-01T22:00:00").getTime();
    const remainingMs = getNightCurfewRemainingMs(config, at10pmMs);
    assert.equal(remainingMs, 8 * 60 * 60 * 1000);
    assert.equal(formatCurfewCountdown(remainingMs), "08:00:00");

    // At 04:30 AM, target is 06:00 AM (1.5 hours = 5,400,000 ms)
    const at430amMs = new Date("2026-10-02T04:30:00").getTime();
    const remainingMorningMs = getNightCurfewRemainingMs(config, at430amMs);
    assert.equal(remainingMorningMs, 90 * 60 * 1000);
    assert.equal(formatCurfewCountdown(remainingMorningMs), "01:30:00");
  });

  await t.test("formats curfew display times correctly", () => {
    assert.equal(formatCurfewTime(22, 0), "10:00 PM");
    assert.equal(formatCurfewTime(6, 0), "6:00 AM");
    assert.equal(formatCurfewTime(0, 30), "12:30 AM");
    assert.equal(formatCurfewTime(12, 15), "12:15 PM");
  });
});
