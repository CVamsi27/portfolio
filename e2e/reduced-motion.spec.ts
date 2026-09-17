import { expect, test } from "@playwright/test";

test("reduced motion disables non-essential animation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/motivation");

  const duration = await page.getByTestId("focus-scene").evaluate((el) => getComputedStyle(el).animationDuration);
  expect(["0s", "0.001s"]).toContain(duration);
});
