import { expect, test } from "@playwright/test";
import { seed } from "./helpers";

test.describe("tracker action bar", () => {
  test("exposes a meaningful primary action on every personal tracker", async ({ page }) => {
    await seed(page);

    const routes = [
      ["/intermittent-fasting", /start fast|save routine/i],
      ["/workout-tracking", /log session/i],
      ["/goal", /log today/i],
      ["/todo", /add task/i],
      ["/motivation", /start focus/i],
      ["/share", /create share/i],
      ["/shared-with-me", /review|retry/i],
      ["/settings", /open backup controls/i],
    ] as const;

    for (const [route, label] of routes) {
      await page.goto(route);
      const bar = page.getByTestId("tracker-action-bar");
      await expect(bar).toBeVisible();
      await expect(bar.getByRole("button", { name: label }).or(bar.getByRole("link", { name: label }))).toBeVisible();
    }
  });

  test("keeps the action bar visible above the mobile dock", async ({ page }) => {
    await seed(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/todo");

    const bar = page.getByTestId("tracker-action-bar");
    const dock = page.getByTestId("mobile-command-dock");
    await expect(bar).toBeVisible();
    await expect(dock).toBeVisible();
    const barBox = await bar.boundingBox();
    const dockBox = await dock.boundingBox();
    expect(barBox).not.toBeNull();
    expect(dockBox).not.toBeNull();
    expect(barBox!.y + barBox!.height).toBeLessThanOrEqual(dockBox!.y + 1);
  });
});
