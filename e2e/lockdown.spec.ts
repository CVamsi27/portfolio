import { expect, test } from "@playwright/test";
import { seed } from "./helpers";

test.describe("Personal lockdown", () => {
  test("does not show a bedtime lock while bedtime is disabled", async ({ page }) => {
    await seed(page, {
      "vk:lockdown:preferences": { bedtimeEnabled: false, bedtimeStart: "00:00", bedtimeEnd: "23:59", bedtimeDays: [0, 1, 2, 3, 4, 5, 6] },
    });
    await page.goto("/trackers");
    await expect(page.getByTestId("bedtime-lock-screen")).toHaveCount(0);
  });

  test("shows an active bedtime lock and supports an emergency exit", async ({ page }) => {
    await seed(page, {
      "vk:lockdown:preferences": { bedtimeEnabled: true, bedtimeStart: "00:00", bedtimeEnd: "23:59", bedtimeDays: [0, 1, 2, 3, 4, 5, 6] },
    });
    await page.goto("/trackers");
    await expect(page.getByTestId("bedtime-lock-screen")).toBeVisible();
    await expect(page.getByTestId("lockdown-limitations")).toBeVisible();
    await page.getByRole("button", { name: /exit bedtime lock/i }).click();
    await expect(page.getByTestId("bedtime-lock-screen")).toHaveCount(0);
    await expect(page.getByTestId("today-header")).toBeVisible();
  });

  test("blocks Personal navigation while focus is active", async ({ page }) => {
    await seed(page, {
      "vk:focus:active": {
        id: "focus_lock",
        label: "Write the next chapter",
        mode: "open",
        startedAt: Date.now(),
        pausedMs: 0,
        interruptions: 0,
        fullscreen: false,
      },
    });
    await page.goto("/trackers");
    await page.getByTestId("tracker-primary-nav").getByRole("link", { name: "Focus" }).click();
    await expect(page).toHaveURL(/\/trackers$/);
    await expect(page.getByTestId("focus-lock-status")).toContainText(/focus is active/i);
    await expect(page.getByText(/1 interruption/i)).toBeVisible();
  });

  test("keeps the gate within supported mobile widths", async ({ page }) => {
    await seed(page, {
      "vk:lockdown:preferences": { bedtimeEnabled: true, bedtimeStart: "00:00", bedtimeEnd: "23:59", bedtimeDays: [0, 1, 2, 3, 4, 5, 6] },
    });
    for (const width of [320, 390, 430]) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto("/trackers");
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    }
  });
});
