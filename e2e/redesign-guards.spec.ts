import { expect, test } from "@playwright/test";
import { seed } from "./helpers";

/**
 * Redesign target-behaviour guards (2026-10-17 unified redesign).
 *
 * These pin the contract in docs/superpowers/specs/2026-10-17-unified-redesign-design.md.
 * They are expected to FAIL against the pre-redesign build and pass once the
 * corresponding phase lands:
 *   - shell/chrome parity + titles + breadcrumbs + honest empty states -> Phase 2
 *   - dock quick capture / search sheet                                  -> Phase 3
 *   - Today now/next card above the fold                                 -> Phase 4
 */

test.describe("redesign guards — chrome parity", () => {
  test("Add a record and Tools render inside the workspace rail", async ({
    page,
  }) => {
    await seed(page);
    for (const route of ["/log", "/more"]) {
      await page.goto(route);
      await expect(
        page.getByTestId("tracker-primary-nav"),
        `rail missing on ${route}`,
      ).toBeVisible();
    }
  });

  test("mobile dock stays available on Add a record", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await seed(page);
    await page.goto("/log");
    await expect(page.getByTestId("mobile-command-dock")).toBeVisible();
  });
});

test.describe("redesign guards — naming", () => {
  const titles: [string, RegExp][] = [
    ["/todo", /^Tasks$/],
    ["/goal", /^Goals$/],
    ["/food", /^Food$/],
    ["/workout-tracking", /^Workouts$/],
    ["/intermittent-fasting", /^Fasting & eating window$/],
    ["/weight-loss", /^Body & weight$/],
    ["/routine", /^Routine reminders$/],
    ["/archive", /^Library$/],
    ["/more", /^Tools$/],
  ];

  for (const [route, title] of titles) {
    test(`${route} page title matches its navigation label`, async ({
      page,
    }) => {
      await seed(page);
      await page.goto(route);
      await expect(page.getByRole("heading", { level: 1 }).first()).toHaveText(
        title,
      );
    });
  }

  const chapters: [string, string][] = [
    ["/todo", "Plan"],
    ["/goal", "Plan"],
    ["/food", "Health"],
    ["/workout-tracking", "Health"],
    ["/weight-loss", "Health"],
    ["/intermittent-fasting", "Health"],
    ["/routine", "Health"],
  ];

  for (const [route, chapter] of chapters) {
    test(`${route} shows its ${chapter} chapter breadcrumb`, async ({
      page,
    }) => {
      await seed(page);
      await page.goto(route);
      const crumb = page.getByTestId("chapter-breadcrumb");
      await expect(crumb).toBeVisible();
      await expect(crumb).toContainText(chapter);
    });
  }
});

test.describe("redesign guards — honest empty states", () => {
  for (const route of ["/todo", "/goal", "/workout-tracking", "/routine"]) {
    test(`${route} shows no negative progress boilerplate when empty`, async ({
      page,
    }) => {
      await seed(page);
      await page.goto(route);
      const main = page.locator("main");
      await expect(main).not.toContainText(/No completed (tasks|focus|study)/i);
      await expect(main).not.toContainText(/No recorded (energy|water)/i);
    });
  }
});

test.describe("redesign guards — progress strip removed", () => {
  for (const route of [
    "/todo",
    "/goal",
    "/food",
    "/health",
    "/weight-loss",
    "/workout-tracking",
    "/intermittent-fasting",
    "/routine",
    "/hub",
    "/plan",
    "/roadmap",
  ]) {
    test(`${route} renders no repeated progress strip`, async ({ page }) => {
      await seed(page);
      await page.goto(route);
      await expect(page.getByTestId("progress-lead")).toHaveCount(0);
    });
  }
});

test.describe("redesign guards — Tools directory", () => {
  test("Tools lists every Tools destination from the shared source", async ({
    page,
  }) => {
    await seed(page);
    await page.goto("/more");
    const links = page.getByTestId("more-links");
    for (const [label, href] of [
      ["Motivation", "/motivation"],
      ["Library", "/archive"],
      ["Sharing", "/share"],
      ["Settings", "/settings"],
    ] as const) {
      await expect(links.locator(`a[href="${href}"]`)).toContainText(label);
    }
  });
});

test.describe("redesign guards — lead became an honest summary", () => {
  test("Today adds a one-line focus summary when the day has a session", async ({
    page,
  }) => {
    const now = Date.now();
    await seed(page, {
      "vk:focus:sessions": [
        {
          id: "focus_guard",
          label: "Chapter 12",
          plannedMinutes: 25,
          startedAt: now - 25 * 60_000,
          endedAt: now,
          durationMinutes: 25,
          status: "completed",
          createdAt: now,
        },
      ],
    });
    await page.goto("/hub");
    await expect(page.getByTestId("page-summary")).toContainText("25 min");
  });
});

test.describe("redesign guards — capture affordances", () => {
  test("mobile dock offers quick add and search beside its destinations", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await seed(page);
    await page.goto("/hub");
    const dock = page.getByTestId("mobile-command-dock");
    await expect(dock).toBeVisible();
    // Five destinations stay.
    await expect(dock.getByRole("link")).toHaveCount(5);
    // Quick capture opens the sheet on the Add tab.
    await page.getByTestId("dock-quick-add").click();
    const sheet = page.getByRole("dialog", { name: /quick add and search/i });
    await expect(sheet).toBeVisible();
    await expect(sheet.getByRole("tab", { name: "Add" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  test("header search opens the sheet on the Search tab", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await seed(page);
    await page.goto("/hub");
    await page.getByTestId("header-search").click();
    const sheet = page.getByRole("dialog", { name: /quick add and search/i });
    await expect(sheet.getByRole("tab", { name: "Search" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  test("QuickSheet Add tab writes a glass of water immediately", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await seed(page);
    await page.goto("/hub");
    await page.getByTestId("dock-quick-add").click();
    const sheet = page.getByRole("dialog", { name: /quick add and search/i });
    await sheet.getByRole("button", { name: "Water +1", exact: true }).click();
    await expect(sheet.getByRole("status")).toContainText("Water logged");
    await expect
      .poll(() =>
        page.evaluate(() => {
          const store = JSON.parse(
            localStorage.getItem("vk:fasting:water") ?? "{}",
          ) as Record<string, number>;
          return Object.values(store).reduce((sum, value) => sum + value, 0);
        }),
      )
      .toBe(1);
  });

  test("QuickSheet restores focus to the affordance that opened it", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await seed(page);
    await page.goto("/hub");
    const opener = page.getByTestId("header-search");
    await opener.click();
    const sheet = page.getByRole("dialog", { name: /quick add and search/i });
    await expect(sheet).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(sheet).toHaveCount(0);
    await expect(opener).toBeFocused();
  });
});

test.describe("redesign guards — Today leads with the next action", () => {
  test("now/next card is visible in the first phone screen", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await seed(page);
    await page.goto("/hub");
    const next = page.getByTestId("today-next-action");
    await expect(next).toBeVisible();
    const box = await next.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.y).toBeLessThan(844);
  });
});
