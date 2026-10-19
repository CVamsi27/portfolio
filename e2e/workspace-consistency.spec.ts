import { test, expect } from "@playwright/test";
import { seed } from "./helpers";

for (const screen of [
  {
    path: "/health?date=2026-10-03",
    label: "Selected date",
    anchor: ".workspace-views",
  },
  {
    path: "/intermittent-fasting?date=2026-10-03",
    label: "Selected date",
    anchor: ".workspace-views",
  },
  {
    path: "/weight-loss?date=2026-10-03",
    label: "Record date",
    anchor: "#weight-entry",
  },
  {
    path: "/food?date=2026-10-03&view=diary",
    label: "Record date",
    anchor: ".workspace-views",
  },
  {
    path: "/dashboard?date=2026-10-03",
    label: "Through date",
    anchor: '[data-testid="progress-chart"]',
  },
  {
    path: "/workout-tracking?date=2026-10-03",
    label: "Selected date",
    anchor: ".workspace-views",
  },
]) {
  test(`${screen.path} keeps its date before page content and preserves selection`, async ({
    page,
  }) => {
    await seed(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(screen.path);
    const date = page.getByLabel(screen.label, { exact: true });
    await expect(date).toHaveValue("2026-10-03");
    const dateBox = await date.boundingBox();
    const contentBox = await page.locator(screen.anchor).first().boundingBox();
    expect(dateBox).not.toBeNull();
    expect(contentBox).not.toBeNull();
    expect(dateBox!.y + dateBox!.height).toBeLessThanOrEqual(contentBox!.y);
    await date.fill("2026-10-02");
    await expect(date).toHaveValue("2026-10-02");
    await expect(page).toHaveURL(/[?&]date=2026-10-02(?:&|$)/);
    await page.reload();
    await expect(page.getByLabel(screen.label, { exact: true })).toHaveValue(
      "2026-10-02",
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
}

for (const width of [320, 390]) {
  test(`milestone completion has a square touch target and persists at ${width}px`, async ({
    page,
  }) => {
    await seed(page, {
      "vk:goal": {
        metricByDay: {},
        milestonesByCategory: {
          relocation: [
            {
              id: "qa-step",
              title: "Define what matters most this season",
              done: false,
            },
          ],
        },
      },
    });
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/goal");
    const control = page.getByRole("button", {
      name: "Mark Define what matters most this season complete",
      exact: true,
    });
    await expect(control).toBeVisible();
    // Hydration can replace the row between resolution and measurement, so
    // wait for a stable box before asserting its size.
    await expect
      .poll(async () => {
        const box = await control.boundingBox();
        return box ? Math.min(box.width, box.height) : 0;
      })
      .toBeGreaterThanOrEqual(44);
    const box = await control.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);
    expect(Math.abs(box!.width - box!.height)).toBeLessThanOrEqual(1);
    await control.click();
    await expect(
      page.getByRole("button", {
        name: "Mark Define what matters most this season incomplete",
        exact: true,
      }),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByRole("button", {
        name: "Mark Define what matters most this season incomplete",
        exact: true,
      }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
}
