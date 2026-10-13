import { test, expect } from "@playwright/test";
import { seed } from "./helpers";
const food = (id: string, date: string, energy: number | null, extra = {}) => ({
  id,
  date,
  name: "Measured meal",
  basisAmount: 100,
  basisUnit: "g",
  quantity: 150,
  nutrients: { energy, protein: 10, calcium: null },
  foodId: id,
  meal: "Lunch",
  source: "Manual",
  updatedAt: 1,
  ...extra,
});
async function records(page: import("@playwright/test").Page) {
  const now = new Date("2026-10-04T09:00:00+05:30");
  await page.clock.install({ time: now });

  await seed(page, {
    "vk:weight-loss": {
      entries: {
        "2026-09-15": { weightKg: 84, updatedAt: 1 },
        "2026-10-01": { weightKg: 82, updatedAt: 1 },
        "2026-10-04": { weightKg: 80, updatedAt: 1 },
      },
      recoveryByDay: {},
      targetKg: 78,
    },
    "vk:nutrition:entries": {
      a: food("a", "2026-10-01", 200),
      b: food("b", "2026-10-01", null),
      c: food("c", "2026-10-04", 100),
      d: food("d", "2026-10-03", 900, { deleted: true }),
    },
    "vk:workouts": {
      "2026-10-04": {
        squat: { done: true, sets: [{ reps: 8, weightKg: 20 }] },
      },
    },
    "vk:fasting:water": { "2026-10-04": 8 },
  });
}
test("dashboard charts saved dated records and portion totals across selectable ranges", async ({ page }) => {
  await records(page);
  await page.goto("/dashboard?view=health&metric=body");
  const lead = page.getByTestId("progress-lead");
  await expect(page.getByTestId("progress-dashboard")).toBeVisible();
  await expect(lead).toHaveCount(1);
  await expect(lead).toContainText("3/30 dated readings");
  await lead.getByText("View dated readings", { exact: true }).click();
  for (const [date, value] of [["2026-09-15", "84"], ["2026-10-01", "82"], ["2026-10-04", "80"]])
    await expect(lead.getByRole("row", { name: new RegExp(date) })).toContainText(value);
  await expect(lead.getByRole("table")).toContainText("Not recorded");
  await page.getByRole("combobox", { name: "Metric", exact: true }).selectOption("energy");
  await expect(lead).toContainText("2/30 dated readings");
  // The chart uses portion-scaled daily totals, rather than inventing missing nutrients.
  await expect(lead.getByRole("row", { name: /2026-10-01/ })).toContainText("300");
  await expect(lead.getByRole("row", { name: /2026-10-04/ })).toContainText("150");
  await expect(lead.getByRole("row", { name: /2026-10-03/ })).toContainText("Not recorded");
  await page.getByRole("combobox", { name: "Range", exact: true }).selectOption("7");
  await expect(lead).toContainText("2/7 dated readings");
  await page.getByRole("combobox", { name: "Metric", exact: true }).selectOption("weight");
  await expect(lead.getByRole("row", { name: /2026-09-15/ })).toHaveCount(0);
  await expect(lead.getByRole("row", { name: /2026-10-04/ })).toContainText("80");
  await page.getByRole("combobox", { name: "Metric", exact: true }).selectOption("sets");
  await expect(lead).toContainText("1 sets in this range");
  await expect(lead.getByRole("row", { name: /2026-10-04/ })).toContainText("1");
});

test("through-date selection changes the period and returning to today restores it", async ({ page }) => {
  await records(page);
  await page.goto("/dashboard?view=health&metric=body");
  await expect(page.getByTestId("progress-lead")).toContainText("3/30 dated readings");
  await page.getByLabel("Through date").fill("2026-09-04");
  await expect(page.getByLabel("Through date")).toHaveValue("2026-09-04");
  await expect(page).toHaveURL(/[?&]date=2026-09-04(?:&|$)/);
  await expect(page.getByTestId("progress-lead")).toContainText("No readings in this range.");
  await page.getByRole("button", { name: "Back to today", exact: true }).click();
  await expect(page.getByLabel("Through date")).toHaveValue("2026-10-04");
  await expect(page.getByTestId("progress-lead")).toContainText("3/30 dated readings");
});

test("empty progress offers recording without fabricated trends and retains navigation", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-10-04T09:00:00+05:30") });
  await seed(page);
  await page.goto("/dashboard?view=health&metric=body");
  await expect(page.getByRole("heading", { level: 1, name: "Progress", exact: true })).toBeVisible();
  const lead = page.getByTestId("progress-lead");
  await expect(lead).toContainText("No readings in this range.");
  await expect(lead.locator("svg[role=img]")).toHaveCount(0);
  await lead.getByRole("link", { name: "Record weight", exact: true }).click();
  await expect(page).toHaveURL(/\/weight-loss\?date=2026-10-04$/);
  await expect(page.getByRole("region", { name: "Seven-day progress" })).toHaveCount(0);
  await page.getByTestId("tracker-primary-nav").getByRole("link", { name: "Health", exact: true }).click();
  await expect(page).toHaveURL(/\/health$/);
});

for (const width of [320, 390, 768, 1440]) {
  test(`populated dashboard has one readable chart without overflow at ${width}px`, async ({ page }) => {
    await records(page);
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/dashboard?view=health&metric=body");
    await expect(page.getByRole("img", { name: /Weight, kg:/ })).toBeVisible();
    await expect(page.getByTestId("progress-lead")).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await page.getByRole("combobox", { name: "Metric", exact: true }).selectOption("energy");
    await page.getByText("View dated readings", { exact: true }).click();
    await expect(page.getByRole("table")).toContainText("300");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  });
}

test("Plan links to Tasks so a chosen task starts focus without changing completion", async ({ page }) => {
  const today = new Date().toISOString().slice(0, 10);
  await seed(page, { "vk:todos": [
    { id: "one", text: "First task", done: false, date: today, priority: "P1", tag: "Work", createdAt: 1 },
    { id: "two", text: "Second task", done: false, date: today, priority: "P2", tag: "Work", createdAt: 2 },
  ] });
  await page.goto("/plan");
  await page.getByRole("link", { name: "Tasks", exact: true }).click();
  await page.getByRole("link", { name: 'Focus on "Second task"', exact: true }).click();
  await expect(page.getByTestId("focus-sprint")).toContainText("Second task");
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("vk:todos")!)[1].done)).toBe(false);
});

test("weight history supports dated corrections and undo without losing other readings", async ({
  page,
}) => {
  await records(page);
  await page.goto("/weight-loss");
  const date = page.getByLabel("Record date", { exact: true });
  await expect(date).toBeVisible();
  await date.fill("2026-10-01");
  await page.getByLabel("Recorded weight", { exact: true }).fill("81");
  await page
    .getByRole("button", { name: "Save weigh-in", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Saved weigh-in");
  const row = page
    .getByTestId("weight-history")
    .getByRole("listitem")
    .filter({ hasText: "2026-10-01" });
  await expect(row).toContainText("81 kg");
  await row.getByRole("button", { name: "Remove" }).click();
  await page.getByRole("button", { name: "Undo weight removal" }).click();
  await expect(row).toContainText("81 kg");
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("vk:weight-loss")!).entries[
          "2026-10-04"
        ].weightKg,
    ),
  ).toBe(80);
});
