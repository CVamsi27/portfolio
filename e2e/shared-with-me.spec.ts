import { expect, test } from "@playwright/test";
import { seed } from "./helpers";

test.describe("shared with me", () => {
  test("redirects the legacy inbox route to canonical Sharing", async ({ page }) => {
    await seed(page);
    await page.goto("/shared-with-me");

    await expect(page).toHaveURL(/\/share\?view=incoming$/);
    await expect(page.getByTestId("shared-inbox-summary")).toBeVisible();
    await expect(page.getByText("Loading shared items…")).toHaveCount(0);
    await expect(page.getByText(/Your shared items|Sign in to see items shared with you|Nothing shared yet/)).toBeVisible();
  });

  test("keeps a compact incoming inbox hierarchy on mobile", async ({ page }) => {
    await seed(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/share?view=incoming");

    await expect(page.getByTestId("shared-inbox-summary")).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  });
});
