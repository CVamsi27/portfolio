import { expect, test } from "@playwright/test";
import { seed, todayKey } from "./helpers";

test.describe("focus sprint", () => {
  test("starts, pauses, resumes, and completes a focus sprint", async ({ page }) => {
    await seed(page);
    await page.goto("/trackers");

    await page.getByRole("button", { name: /start focus sprint/i }).click();
    await expect(page.getByRole("button", { name: /pause sprint/i })).toBeVisible();
    await page.getByRole("button", { name: /pause sprint/i }).click();
    await expect(page.getByRole("button", { name: /resume sprint/i })).toBeVisible();
    await page.getByRole("button", { name: /finish sprint/i }).click();
    await expect(page.getByText(/focus sprint complete/i)).toBeVisible();

    const sessions = await page.evaluate(() => JSON.parse(localStorage.getItem("vk:focus:sessions") ?? "[]"));
    expect(sessions[0].status).toBe("completed");
  });

  test("does not complete a todo or change the goal metric", async ({ page }) => {
    const today = todayKey();
    await seed(page, {
      "vk:todos": [{ id: "task_1", text: "Visa checklist", done: false, date: today, priority: "P1", tag: "Goal", createdAt: 1 }],
      "vk:goal": { metricByDay: { [today]: 2 }, milestonesByCategory: {} },
    });
    await page.goto("/trackers");

    await page.getByRole("button", { name: /start focus sprint/i }).click();
    await page.getByRole("button", { name: /finish sprint/i }).click();

    expect(await page.evaluate(() => JSON.parse(localStorage.getItem("vk:todos") ?? "[]")[0].done)).toBe(false);
    expect(await page.evaluate((key) => JSON.parse(localStorage.getItem("vk:goal") ?? "{}").metricByDay[key], today)).toBe(2);
  });
});
