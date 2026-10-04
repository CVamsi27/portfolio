import { expect, test } from "@playwright/test";
import { seed } from "./helpers";

async function openRest(page: import("@playwright/test").Page) {
  await seed(page);
  await page.goto("/workout-tracking");
  await page.getByRole("button", { name: "Mark Squats done" }).click();
}

test("rest timer stays above tablet navigation with usable controls", async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 900 });
  await openRest(page);
  const timer = page.getByText("Rest timer", { exact: true }).locator("../..");
  const dock = (await page.getByTestId("mobile-command-dock").boundingBox())!;
  const bounds = (await timer.boundingBox())!;
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(dock.y - 8);
  const close = (await page.getByRole("button", { name: "Close rest timer" }).boundingBox())!;
  expect(close.width).toBeGreaterThanOrEqual(44);
  expect(close.height).toBeGreaterThanOrEqual(44);
});

test("rest preset updates the progress duration and completed timer cannot pause", async ({ page }) => {
  const start = new Date("2026-10-04T09:00:00Z");
  await page.clock.install({ time: start });
  await page.clock.pauseAt(start);
  await openRest(page);
  await page.getByRole("button", { name: "60s", exact: true }).click();
  const timer = page.getByTestId("rest-timer");
  await expect(timer.getByRole("progressbar")).toHaveAttribute("aria-valuemax", "60");
  await page.clock.runFor(30000);
  await expect(timer.locator('[role="img"]')).toHaveAttribute("aria-label", "Progress 50%");
  await page.clock.runFor(30000);
  await expect(page.getByText("Rest done — next set!", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Pause", exact: true })).toBeDisabled();
});

test("plate calculator rejects loads below the bar and labels selected presets", async ({ page }) => {
  await seed(page);
  await page.goto("/workout-tracking");
  await page.getByText("Workout plan and split settings",{exact:true}).click();
  await page.getByRole("button", { name: "Plates", exact: true }).click();
  const weight = page.getByRole("spinbutton", { name: "Target weight (kg):" });
  await weight.fill("10");
  await expect(weight).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByText("Total on bar: 10 kg")).toHaveCount(0);
  await expect(page.locator("#plate-weight-error")).toContainText("at least 20 kg");
  await page.getByRole("button", { name: "60", exact: true }).click();
  await expect(page.getByRole("button", { name: "60", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(weight).toHaveAttribute("aria-invalid", "false");
});

test("hydration choices have phone-sized targets and expose the exact count", async ({ page }) => {
  await seed(page);
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto("/intermittent-fasting");
  const choice = page.getByRole("button", { name: "Set hydration to 3 glasses" });
  await choice.click();
  await expect(choice).toHaveAttribute("aria-pressed", "true");
  const bounds = (await choice.boundingBox())!;
  expect(bounds.width).toBeGreaterThanOrEqual(44);
  await expect(page.getByRole("progressbar", { name: "Water logged" })).toHaveAttribute("aria-valuenow", "3");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});
