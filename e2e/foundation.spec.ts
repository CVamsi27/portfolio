import { expect, test } from "@playwright/test";
import { seed } from "./helpers";

test("tracker shell exposes chapter header and mobile command dock", async ({ page }) => {
  await seed(page);
  await page.goto("/trackers");
  await expect(page.getByText(/Command Center|Welcome back/)).toBeVisible();
  await expect(page.getByTestId("chapter-header")).toBeVisible();
  await expect(page.getByTestId("personal-section-header")).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByTestId("mobile-command-dock")).toBeVisible();
  await expect(page.getByTestId("mobile-command-dock")).toHaveAttribute("data-dock-context", "core");
});
