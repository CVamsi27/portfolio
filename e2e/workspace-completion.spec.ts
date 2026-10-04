import { test, expect } from "@playwright/test";
import { seed } from "./helpers";
test("task search and filters combine and can be cleared without changing records", async ({
  page,
}) => {
  const today = new Date().toISOString().slice(0, 10);
  await seed(page, {
    "vk:todos": [
      {
        id: "a",
        text: "Review API notes",
        done: false,
        date: today,
        priority: "P1",
        tag: "Work",
        createdAt: 1,
      },
      {
        id: "b",
        text: "Review exercise plan",
        done: false,
        date: today,
        priority: "P2",
        tag: "Health",
        createdAt: 2,
      },
    ],
  });
  await page.goto("/todo");
  const search = page.getByLabel("Search tasks", { exact: true });
  await expect(search).toBeVisible();
  await search.fill("review");
  await page.getByLabel("Filter by tag").selectOption("Work");
  await expect(
    page.getByText("Review API notes", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Review exercise plan", { exact: true }),
  ).toBeHidden();
  await page
    .getByRole("button", { name: "Clear filters", exact: true })
    .click();
  await expect(search).toHaveValue("");
  await expect(
    page.getByText("Review exercise plan", { exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("vk:todos")!).length,
    ),
  ).toBe(2);
});
test("today completion does not count old completed tasks as today activity", async ({
  page,
}) => {
  const now = Date.now();
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(now - 86400000).toISOString().slice(0, 10);
  await seed(page, {
    "vk:todos": [
      {
        id: "old",
        text: "Old completion",
        done: true,
        date: yesterday,
        completedAt: now - 86400000,
        priority: "P1",
        tag: "Work",
        createdAt: 1,
      },
      {
        id: "new",
        text: "New completion",
        done: true,
        date: today,
        completedAt: now,
        priority: "P1",
        tag: "Work",
        createdAt: 1,
      },
      {
        id: "pending",
        text: "Pending action",
        done: false,
        date: today,
        priority: "P1",
        tag: "Work",
        createdAt: 1,
      },
    ],
  });
  await page.goto("/todo");
  await expect(page.getByText("1/2 done today", { exact: true })).toBeVisible();
});
test("secondary tracking pages return to their parent section", async ({
  page,
}) => {
  await seed(page);
  await page.goto("/food");
  await expect(
    page
      .getByTestId("chapter-header")
      .getByRole("link", { name: "Health", exact: true }),
  ).toHaveAttribute("href", "/health");
  await page.goto("/todo");
  await expect(
    page
      .getByTestId("chapter-header")
      .getByRole("link", { name: "Plan", exact: true }),
  ).toHaveAttribute("href", "/plan");
});

test("progress includes journal coverage and goal readings without filling missing days", async ({
  page,
}) => {
  const now = new Date("2026-10-04T09:00:00+05:30");
  await page.clock.install({ time: now });
  await page.clock.pauseAt(now);
  await seed(page, {
    "vk:goal": {
      metricByDay: { "2026-10-03": 0, "2026-10-04": 5 },
      milestonesByCategory: {},
    },
    "vk:journal": {
      "2026-10-04": {
        win: "Delivered the API",
        learned: "",
        focus: "",
        updatedAt: 1,
      },
    },
  });
  await page.goto("/dashboard");
  await expect(page.locator("#goals")).toContainText(
    "Journal days recorded in this range: 1",
  );
  await page
    .getByText("Goal metric trend · 2 recorded days", { exact: true })
    .click();
  await expect(page.locator("#goals svg[role=img]")).toBeVisible();
});

for (const width of [320, 390]) {
  test(`task names retain reading space at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await seed(page, {
      "vk:todos": [
        {
          id: "long",
          text: "Complete API design practice and prepare interview notes",
          done: false,
          date: new Date().toISOString().slice(0, 10),
          priority: "P1",
          tag: "Work",
          createdAt: 1,
        },
      ],
    });
    await page.goto("/todo");
    const name = page.getByRole("button", {
      name: "Complete API design practice and prepare interview notes",
      exact: true,
    });
    await expect(name).toBeVisible();
    expect((await name.boundingBox())!.width).toBeGreaterThan(150);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
  });
}

test("mobile milestone names have room beside touch controls", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await seed(page);
  await page.goto("/goal");
  const name = page.locator(".milestone-name").first();
  await expect(name).toBeVisible();
  expect((await name.boundingBox())!.width).toBeGreaterThan(150);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(320);
});
