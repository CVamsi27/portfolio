import { expect, test } from "@playwright/test";
import { seed } from "./helpers";

test.use({ timezoneId: "Asia/Kolkata" });

test("clock shows the local date and timezone at phone widths", async ({
  page,
}) => {
  await seed(page);
  await page.clock.install({ time: new Date("2026-10-03T00:05:00+05:30") });
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto("/hub");
  const clock = page.getByTestId("world-clock-strip");
  await expect(clock.locator(".dossier-world-date")).toBeVisible();
  await expect(clock.getByTestId("local-clock-time")).toHaveText("00:05");
  await expect(clock.getByTestId("local-clock-zone")).toContainText("GMT+5:30");
  await clock.locator("summary").click();
  await expect(clock.getByTestId("clock-Munich")).toContainText("Fri, Oct 2");
  await expect(clock.getByTestId("clock-Munich")).toContainText("20:35");
  await expect(clock.getByTestId("clock-San Francisco")).toContainText("11:35");
  const panel = (await clock.locator(".dossier-clock-details").boundingBox())!;
  const city = (await clock.getByTestId("clock-Munich").boundingBox())!;
  expect(city.width).toBeGreaterThanOrEqual(panel.width - 32);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(320);
});

test("clock advances across local midnight without stale dates", async ({
  page,
}) => {
  await seed(page);
  await page.clock.install({ time: new Date("2026-10-03T23:59:58+05:30") });
  await page.goto("/hub");
  const clock = page.getByTestId("world-clock-strip");
  await expect(clock.getByTestId("local-clock-time")).toHaveText("23:59");
  await page.clock.runFor(3000);
  await expect(clock.getByTestId("local-clock-time")).toHaveText("00:00");
  await expect(clock.locator(".dossier-world-date")).toHaveText("Sun, Oct 4");
});

test("city clocks respect daylight saving changes", async ({ page }) => {
  await seed(page);
  await page.clock.install({ time: new Date("2026-10-25T00:59:58Z") });
  await page.goto("/hub");
  const clock = page.getByTestId("world-clock-strip");
  await clock.locator("summary").click();
  const munich = clock.getByTestId("clock-Munich");
  await expect(munich.locator("time")).toHaveText("02:59");
  await page.clock.runFor(3000);
  await expect(munich.locator("time")).toHaveText("02:00");
  await expect(munich).toContainText("GMT+1");
});
