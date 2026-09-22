import { expect, test } from "@playwright/test";
import { seed } from "./helpers";

test.describe("personal today cockpit", () => {
  test("leads with one move and one continuation cue", async ({ page }) => {
    await seed(page);
    await page.goto("/hub");

    await expect(page.getByTestId("today-header")).toBeVisible();
    await expect(page.getByTestId("next-move-card")).toBeVisible();
    await expect(page.getByTestId("progress-rail")).toBeVisible();
    await expect(page.getByTestId("up-next-lane")).toBeVisible();
    await expect(page.getByTestId("action-queue")).toBeHidden();
    await expect(page.getByTestId("daily-momentum-ring")).toHaveCount(0);
    await expect(page.getByTestId("today-details")).toBeVisible();
  });

  test("keeps secondary tracker detail behind an accessible disclosure", async ({ page }) => {
    await seed(page);
    await page.goto("/hub");
    await expect(page.getByTestId("action-queue")).toBeHidden();
    await page.getByTestId("today-details").locator("summary").click();
    await expect(page.getByTestId("action-queue")).toBeVisible();
    await expect(page.getByTestId("week-pulse")).toBeVisible();
  });

  test("exposes four execution destinations on desktop and mobile", async ({ page }) => {
    await seed(page);
    await page.goto("/hub");
    const primary = page.getByTestId("tracker-primary-nav");
    await expect(primary.getByRole("link")).toHaveCount(4);
    for (const [label, href] of [["Today", "/hub"], ["Focus", "/motivation"], ["Log", "/log"], ["More", "/more"]] as const) {
      await expect(primary.getByRole("link", { name: label })).toHaveAttribute("href", href);
    }

    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.getByTestId("mobile-command-dock").getByRole("link")).toHaveCount(4);
    await expect(page.getByTestId("mobile-command-dock").getByRole("link", { name: "Log" })).toHaveAttribute("href", "/log");
  });

  test("captures a task and note from Log", async ({ page }) => {
    await seed(page);
    await page.goto("/log");
    await expect(page.getByTestId("log-capture")).toBeVisible();
    await page.getByLabel("Task to log").fill("Send the application");
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.getByRole("status")).toContainText("Task added");
    await page.getByLabel("Note to log").fill("Keep the next step small");
    await page.getByRole("button", { name: /save note/i }).click();
    await expect(page.getByRole("status")).toContainText("Note saved");
  });

  test("keeps More focused on secondary tools", async ({ page }) => {
    await seed(page);
    await page.goto("/more");
    await expect(page.getByTestId("more-links")).toBeVisible();
    await expect(page.getByRole("link", { name: /Goals/ })).toHaveAttribute("href", "/goal");
    await expect(page.getByRole("link", { name: /Health \/ Weight loss/ })).toHaveAttribute("href", "/weight-loss");
    await expect(page.getByRole("link", { name: /Settings/ })).toHaveAttribute("href", "/settings");
  });

  test("has no horizontal overflow at supported mobile widths", async ({ page }) => {
    await seed(page);
    for (const width of [320, 390, 430]) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto("/hub");
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    }
  });
});
