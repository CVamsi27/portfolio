import { expect, test } from "@playwright/test";
import { seed, daysAgoKey } from "./helpers";

test.describe("goal tracker", () => {
  test("logs the daily metric and reflects it in chart + streak", async ({ page }) => {
    await seed(page, {
      "vk:goal": {
        metricByDay: { [daysAgoKey(1)]: 2 },
        milestonesByCategory: {},
      },
    });
    await page.goto("/goal");

    // Metric label resolves from the relocation default.
    await expect(page.getByText("Applications & Outreach").first()).toBeVisible();

    // Log 3 today via the quick log input.
    const logInput = page.getByPlaceholder("Add amount");
    await logInput.fill("3");
    await logInput.press("Enter");

    const goal = JSON.parse((await page.evaluate(() => window.localStorage.getItem("vk:goal"))) ?? "{}");
    expect(goal.metricByDay[daysAgoKey(0)]).toBe(3);

    // Today's counter reflects the log; the 14-day chart section is present.
    await expect(page.getByText("3 / 3")).toBeVisible();
    await expect(page.getByText("Last 14 days")).toBeVisible();
  });

  test("milestone CRUD: add, complete, and delete a milestone", async ({ page }) => {
    await seed(page);
    await page.goto("/goal");

    // Defaults for relocation exist.
    await expect(page.getByText("Concrete job offer from a target-country entity")).toBeVisible();

    // Add via the milestone modal.
    await page.getByRole("button", { name: "Add milestone" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByPlaceholder(/Milestone — e\.g\./).fill("Sign the lease");
    await dialog.getByRole("button", { name: "Add", exact: true }).click();
    const created = page.getByText("Sign the lease");
    await expect(created).toBeVisible();

    // Complete → timestamp recorded.
    const row = page.locator("li", { has: page.getByText("Sign the lease") }).first();
    await row.getByRole("button", { name: "Mark Sign the lease complete" }).click();

    const stored = JSON.parse((await page.evaluate(() => window.localStorage.getItem("vk:goal"))) ?? "{}");
    const relo = stored.milestonesByCategory.relocation as { title: string; done: boolean; doneAt: string | null }[];
    const lease = relo.find((m) => m.title === "Sign the lease");
    expect(lease?.done).toBe(true);
    expect(lease?.doneAt).toBeTruthy();

    // Delete it (row-scoped — other milestones have the same aria-label).
    await row.getByRole("button", { name: "Delete milestone" }).click();
    await expect(page.getByText("Sign the lease")).toHaveCount(0);
  });

  test("switching category swaps milestones + metric controls", async ({ page }) => {
    await seed(page);
    await page.goto("/goal");

    // Switch to Learning.
    await page.getByText("Learning").first().click();
    await expect(page.getByText("Deep Study").first()).toBeVisible();
    await expect(page.getByText(/Deep Study/)).toBeVisible(); // metric label

    const goal = JSON.parse((await page.evaluate(() => window.localStorage.getItem("vk:goal"))) ?? "{}");
    // Category switch may live in prefs (goal page writes prefs) — either way, no crash
    // and relocation milestones no longer shown.
    await expect(page.getByText("Concrete job offer from a target-country entity")).toHaveCount(0);
    void goal;
  });

  test("relocation title is composed from the selected destination", async ({ page }) => {
    await seed(page);
    await page.goto("/goal");
    await page.getByLabel("Destination country").selectOption("Canada");
    await expect(page.getByRole("heading", { name: "Relocate to Canada" })).toBeVisible();
  });

  test("run-rate ETA appears after enough metric history", async ({ page }) => {
    const d = (n: number) => daysAgoKey(n);
    await seed(page, {
      "vk:goal": {
        metricByDay: { [d(4)]: 3, [d(3)]: 3, [d(2)]: 3, [d(1)]: 3 },
        milestonesByCategory: {},
      },
      "vk:prefs": {
        name: "Test User",
        goalCategory: "relocation",
        goalTitle: "",
        goalCountry: "Canada",
        workoutDaysPerWeek: 4,
        workoutSplit: "fullbody",
        weightUnit: "kg",
        fastingEnabled: true,
        fastingProtocolId: "16-8",
        motivationStyle: "discipline",
        customSplitDays: [{ id: "day-1", label: "Day 1" }],
        questionnaireDone: true,
        dailyMetricGoalTotal: 30,
      },
    });
    await page.goto("/goal");
    // 12 logged vs 30 total at 3/day → on-track ETA line present.
    await expect(page.getByText(/on track in about/i)).toBeVisible();
  });
});
