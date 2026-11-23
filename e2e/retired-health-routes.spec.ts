import { expect, test } from "@playwright/test";
import { seed } from "./helpers";

test.describe("retired manual health routes & Google Health Connect", () => {
  for (const retiredPath of [
    "/food",
    "/workout-tracking",
    "/intermittent-fasting",
    "/weight-loss",
  ]) {
    test(`${retiredPath} redirects cleanly to read-only /health`, async ({
      page,
    }) => {
      await seed(page);
      await page.goto(retiredPath);
      await expect(page).toHaveURL(/\/health\?notice=retired-manual/);
      await expect(
        page.getByRole("heading", { name: /Health/i }).first(),
      ).toBeVisible();
    });
  }

  test("/routine redirects to /settings?view=notifications", async ({ page }) => {
    await seed(page);
    await page.goto("/routine");
    await expect(page).toHaveURL(/\/settings\?view=notifications/);
  });

  test("/health renders read-only Google Health Connect dashboard with no manual logging forms", async ({
    page,
  }) => {
    await page.clock.setFixedTime(new Date("2026-11-23T09:00:00Z"));
    await seed(page);
    await page.route("**/api/health-connect/devices", (route) =>
      route.fulfill({
        json: {
          devices: [
            {
              id: "dev-1",
              label: "Pixel 9",
              pairedAt: "2026-11-23T06:00:00Z",
              lastSyncAt: "2026-11-23T08:00:00Z",
              revokedAt: null,
            },
          ],
          counts: { weight: 1, steps: 1, sleep: 1 },
        },
      }),
    );
    await page.route("**/api/health-connect/records**", (route) =>
      route.fulfill({
        json: {
          total: 3,
          records: [
            {
              id: "steps-1",
              type: "steps",
              date: "2026-11-23",
              value: 8420,
              unit: "count",
              source: "Google Fit",
              measuredAt: "2026-11-23T08:00:00Z",
              updatedAt: 1,
            },
            {
              id: "sleep-1",
              type: "sleep",
              date: "2026-11-23",
              value: 455,
              unit: "minutes",
              source: "Pixel Watch",
              measuredAt: "2026-11-23T07:00:00Z",
              updatedAt: 1,
            },
            {
              id: "exercise-1",
              type: "exercise",
              date: "2026-11-23",
              value: 42,
              unit: "minutes",
              source: "Pixel Watch",
              measuredAt: "2026-11-23T07:30:00Z",
              updatedAt: 1,
              activityType: "running",
              title: "Morning Run",
            },
          ],
          hasMore: false,
        },
      }),
    );

    await page.goto("/health");
    await expect(page.getByText(/Google Health Connect/i).first()).toBeVisible();
    await expect(page.getByText(/8,420|8420/).first()).toBeVisible();
    await expect(page.getByText(/Morning Run/i).first()).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Log meal|Add food|Log workout|Start fast/i }),
    ).toHaveCount(0);
  });
});
