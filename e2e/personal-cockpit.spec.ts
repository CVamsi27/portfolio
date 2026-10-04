import { expect, test } from "@playwright/test";
import { seed } from "./helpers";

test.describe("personal today cockpit", () => {
  test("leads with one primary move without a duplicate continuation card", async ({ page }) => {
    await seed(page);
    await page.goto("/hub");

    await expect(page.getByTestId("today-header")).toBeVisible();
    await expect(page.getByTestId("next-move-card")).toBeVisible();
    await expect(page.getByTestId("progress-rail")).toHaveCount(0);
    await expect(page.getByTestId("up-next-lane")).toHaveCount(0);
    await expect(page.getByTestId("next-move-card")).not.toContainText(/meal window|concrete job offer|about 10 min/i);
    await expect(page.getByTestId("action-queue")).toBeHidden();
    await expect(page.getByTestId("daily-momentum-ring")).toHaveCount(0);
    await expect(page.getByTestId("today-details")).toHaveCount(0);
  });

  test("secondary detail lives in Review instead of another Today dashboard", async ({page})=>{
    await seed(page);await page.goto("/hub");await expect(page.getByTestId("week-pulse")).toHaveCount(0);await page.getByTestId("tracker-primary-nav").getByRole("link",{name:"Review"}).click();await expect(page.getByRole("heading",{name:"Focus",exact:true})).toBeVisible();
  });

  test("exposes five execution destinations on desktop and mobile", async ({ page }) => {
    await seed(page);
    await page.goto("/hub");
    const primary = page.getByTestId("tracker-primary-nav");
    await expect(primary.getByRole("link")).toHaveCount(5);
    for (const [label, href] of [["Today", "/hub"], ["Plan", "/plan"], ["Health", "/health"], ["Review", "/review"], ["More", "/more"]] as const) {
      await expect(primary.getByRole("link", { name: label })).toHaveAttribute("href", href);
    }

    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.getByTestId("mobile-command-dock").getByRole("link")).toHaveCount(5);
    await expect(page.getByTestId("mobile-command-dock").getByRole("link", { name: "Review" })).toHaveAttribute("href", "/review");
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
    await expect(page.getByRole("link", { name: /Motivation/ })).toHaveAttribute("href", "/motivation");
    await expect(page.getByRole("link", { name: /Library/ })).toHaveAttribute("href", "/archive");
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
