import { expect, test } from "@playwright/test";
import { seed, fastEntry } from "./helpers";

const H = 3600_000;

test.describe("intermittent fasting tracker", () => {
  test("starts a fast, ticks the timer, and ends+logs it to history", async ({ page }) => {
    await seed(page);
    await page.goto("/intermittent-fasting");

    // Idle state.
    await expect(page.getByText("Not started")).toBeVisible();
    await expect(page.getByRole("button", { name: "Start Fast" })).toBeVisible();
    await expect(page.getByText("No fasts logged yet")).toBeVisible();

    // Start → derived timer appears (timestamp engine, no drift).
    await page.getByRole("button", { name: "Start Fast" }).click();
    await expect(page.getByText(/h .*m left/)).toBeVisible();
    await expect(page.getByRole("button", { name: "End & Log" })).toBeVisible();

    // Running state persisted.
    let st = JSON.parse((await page.evaluate(() => window.localStorage.getItem("vk:fasting"))) ?? "{}");
    expect(st.startedAt).toBeGreaterThan(0);
    expect(st.phase).toBe("fasting");

    // End & Log → history entry (>= 0.25h rule: fast was seconds old, so none).
    await page.getByRole("button", { name: "End & Log" }).click();
    await expect(page.getByText("Not started")).toBeVisible();
    st = JSON.parse((await page.evaluate(() => window.localStorage.getItem("vk:fasting"))) ?? "{}");
    expect(st.startedAt).toBeNull();
    const history = JSON.parse((await page.evaluate(() => window.localStorage.getItem("vk:fasting:history"))) ?? "[]");
    expect(history).toHaveLength(0);
  });

  test("fasts ≥ 15 minutes land in history with stats and are deletable", async ({ page }) => {
    const now = Date.now();
    await seed(page, {
      "vk:fasting:history": [fastEntry("f_seed", now - 20 * H, now - 4 * H)],
    });
    await page.goto("/intermittent-fasting");

    await expect(page.getByText("1 fasts logged")).toBeVisible();
    // Longest fast stat — the row itself also shows 16.0h, so anchor via the Stat card.
    await expect(page.getByText("Longest").locator("xpath=..").getByText("16.0 h")).toBeVisible();
    await expect(page.getByText(/Avg fast \(7d\)/)).toBeVisible();

    // Delete the entry via the row's trash button.
    await page.getByRole("button", { name: "Delete fast" }).click();
    await expect(page.getByText("No fasts logged yet")).toBeVisible();
    const history = JSON.parse((await page.evaluate(() => window.localStorage.getItem("vk:fasting:history"))) ?? "[]");
    expect(history).toHaveLength(0);
  });

  test("manual past-fast entry saves with date + times", async ({ page }) => {
    await seed(page);
    await page.goto("/intermittent-fasting");

    await page.getByRole("button", { name: "Log past fast" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    // Labels aren't programmatically associated — target by input type.
    await dialog.locator("input[type=date]").fill("2026-09-15");
    const times = dialog.locator("input[type=time]");
    await times.nth(0).fill("20:00");
    await times.nth(1).fill("12:00"); // overnight → +1 day handling
    await dialog.getByPlaceholder(/forgot to start/i).fill("Forgot to start the timer");
    await dialog.getByRole("button", { name: "Save fast" }).click();

    await expect(page.getByText("1 fasts logged")).toBeVisible();
    const history = JSON.parse((await page.evaluate(() => window.localStorage.getItem("vk:fasting:history"))) ?? "[]");
    expect(history).toHaveLength(1);
    expect(history[0].source).toBe("manual");
    const hours = (history[0].end - history[0].start) / H;
    expect(hours).toBeCloseTo(16, 0);
  });

  test("protocol switcher updates the stored protocol", async ({ page }) => {
    await seed(page);
    await page.goto("/intermittent-fasting");
    await page.getByRole("button", { name: "18:6" }).click();
    await expect(page.getByText("18h Fast / 6h Eat")).toBeVisible();
    const st = JSON.parse((await page.evaluate(() => window.localStorage.getItem("vk:fasting"))) ?? "{}");
    expect(st.protocolId).toBe("18-6");
  });
});
