import { expect, test } from "@playwright/test";
import { seed } from "./helpers";
test("shared Add is available without stacking an action bar on every editor", async ({
  page,
}) => {
  await seed(page);
  for (const route of [
    "/intermittent-fasting",
    "/workout-tracking",
    "/goal",
    "/todo",
    "/share",
    "/settings",
  ]) {
    await page.goto(route);
    await expect(page.getByTestId("tracker-action-bar")).toHaveCount(0);
    await page.getByRole("button", { name: "Quick capture" }).click();
    const dialog = page.getByRole("dialog", { name: "Add a record" });
    await expect(
      dialog.getByRole("button", { name: "Task", exact: true }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  }
});
test("mobile dock has four destinations and dated Add", async ({ page }) => {
  await seed(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/health?date=2026-10-01");
  const dock = page.getByTestId("mobile-command-dock");
  await expect(dock).toBeVisible();
  await expect(dock.getByRole("link")).toHaveCount(5);
  await page.getByRole("button", { name: "Quick capture" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Weight", exact: true })
    .click();
  await expect(page.getByLabel("Record date")).toHaveValue("2026-10-01");
});
