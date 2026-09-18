import { expect, test } from "@playwright/test";
import { seed, fastEntry } from "./helpers";
import { calculateMealWindow } from "../src/lib/fasting-window";

const H = 3600_000;

test.describe("intermittent fasting tracker", () => {
  test("calculates an overnight meal window without a timer", async ({ page }) => {
    const result = calculateMealWindow("12:00", "20:00");
    expect(result).toMatchObject({ fastHours: 16, eatingHours: 8, overnight: true });

    await seed(page);
    await page.goto("/intermittent-fasting");
    await expect(page.getByRole("heading", { name: "Set your daily routine" }).first()).toBeVisible();
    await expect(page.getByLabel("First meal time")).toBeVisible();
    await expect(page.getByLabel("Last meal time")).toBeVisible();
    await expect(page.getByRole("button", { name: "Start Fast" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /End & Log/ })).toHaveCount(0);

    await page.getByLabel("First meal time").fill("12:00");
    await page.getByLabel("Last meal time").fill("20:00");
    await page.getByRole("button", { name: "Save routine and use for today" }).click();
    await expect(page.getByText("16.0 hours fasting")).toBeVisible();

    const history = JSON.parse((await page.evaluate(() => window.localStorage.getItem("vk:fasting:history"))) ?? "[]");
    expect(history[0].source).toBe("meal-window");
    await expect(page.getByRole("button", { name: "24 hours" })).toBeVisible();
    await expect(page.getByRole("button", { name: "7 days" })).toBeVisible();
    await expect(page.getByRole("button", { name: "30 days" })).toBeVisible();
  });

  test("shows the routine-first meal window form", async ({ page }) => {
    await seed(page);
    await page.goto("/intermittent-fasting");

    await expect(page.getByRole("heading", { name: "Set your daily routine" }).first()).toBeVisible();
    await expect(page.getByText("No meal windows logged yet")).toBeVisible();
    await expect(page.getByRole("button", { name: "Start Fast" })).toHaveCount(0);
  });

  test("fasts ≥ 15 minutes land in history with stats and are deletable", async ({ page }) => {
    const now = Date.now();
    await seed(page, {
      "vk:fasting:history": [fastEntry("f_seed", now - 20 * H, now - 4 * H)],
    });
    await page.goto("/intermittent-fasting");

    await expect(page.getByText("1 windows logged", { exact: true })).toBeVisible();
    // Longest fast stat — the row itself also shows 16.0h, so anchor via the Stat card.
    await expect(page.getByText("Longest").locator("xpath=..").getByText("16.0 h")).toBeVisible();
    await expect(page.getByText(/Avg window \(7d\)/)).toBeVisible();

    // Delete the entry via the row's trash button.
    await page.getByRole("button", { name: "Delete meal window" }).click();
    await expect(page.getByText("No meal windows logged yet")).toBeVisible();
    const history = JSON.parse((await page.evaluate(() => window.localStorage.getItem("vk:fasting:history"))) ?? "[]");
    expect(history).toHaveLength(0);
  });

  test("another-day meal window saves with date + times", async ({ page }) => {
    await seed(page);
    await page.goto("/intermittent-fasting");

    await page.getByRole("button", { name: "Log another day" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    await dialog.getByLabel("Date").fill("2026-09-15");
    await page.getByLabel("First meal time").fill("12:00");
    await page.getByLabel("Last meal time").fill("20:00");
    await dialog.getByPlaceholder("Note (optional)").fill("Routine exception");
    await dialog.getByRole("button", { name: "Save window" }).click();

    await expect(page.getByText("1 windows logged", { exact: true })).toBeVisible();
    const history = JSON.parse((await page.evaluate(() => window.localStorage.getItem("vk:fasting:history"))) ?? "[]");
    expect(history).toHaveLength(1);
    expect(history[0].source).toBe("meal-window");
    const hours = (history[0].end - history[0].start) / H;
    expect(hours).toBeCloseTo(16, 0);
  });

  test("auto-clear selection updates the fasting store", async ({ page }) => {
    await seed(page);
    await page.goto("/intermittent-fasting");
    await page.getByRole("button", { name: "24 hours" }).click();
    const st = JSON.parse((await page.evaluate(() => window.localStorage.getItem("vk:fasting"))) ?? "{}");
    expect(st.autoClearHours).toBe(24);
  });
});
